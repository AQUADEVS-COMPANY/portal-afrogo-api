-- =====================================================================
-- AfroGo - Migration 002: panel users, roles, JWT login support.
-- Run AFTER aquadevs_afrogo_api_dev.sql. Safe to run more than once.
-- =====================================================================
USE aquadevs_afrogo_api_dev;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS roles (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(20) NOT NULL,
  name  VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, code, name) VALUES
  (1, 'administrator', 'Administrador'),
  (2, 'secretary',     'Secretario');

CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36) NOT NULL DEFAULT (UUID()),
  full_name      VARCHAR(120) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(100) NOT NULL,
  role_id        TINYINT UNSIGNED NOT NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at  DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB;

-- driver_logs.user_id: who approved/rejected. No FK on purpose (logs survive).
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'driver_logs' AND COLUMN_NAME = 'user_id');
SET @ddl := IF(@has_col = 0,
               'ALTER TABLE driver_logs ADD COLUMN user_id CHAR(36) NULL AFTER driver_id',
               'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_user_get_by_email$$
CREATE PROCEDURE sp_user_get_by_email(IN p_email VARCHAR(150))
BEGIN
  SELECT u.id, u.full_name, u.email, u.password_hash, u.is_active, u.last_login_at,
         r.code AS role_code, r.name AS role_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.email = LOWER(TRIM(p_email));
END$$

DROP PROCEDURE IF EXISTS sp_user_get_by_id$$
CREATE PROCEDURE sp_user_get_by_id(IN p_user_id CHAR(36))
BEGIN
  SELECT u.id, u.full_name, u.email, u.is_active, u.last_login_at,
         r.code AS role_code, r.name AS role_name
  FROM users u
  JOIN roles r ON r.id = u.role_id
  WHERE u.id = p_user_id;
END$$

DROP PROCEDURE IF EXISTS sp_user_create$$
CREATE PROCEDURE sp_user_create(
  IN p_full_name      VARCHAR(120),
  IN p_email          VARCHAR(150),
  IN p_password_hash  VARCHAR(100),
  IN p_role_code      VARCHAR(20)
)
BEGIN
  DECLARE v_role_id TINYINT UNSIGNED;
  DECLARE v_user_id CHAR(36);
  DECLARE EXIT HANDLER FOR 1062
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_EMAIL';
  SET p_email = LOWER(TRIM(p_email));
  SELECT id INTO v_role_id FROM roles WHERE code = p_role_code;
  IF v_role_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_ROLE';
  END IF;
  SET v_user_id = UUID();
  INSERT INTO users (id, full_name, email, password_hash, role_id)
  VALUES (v_user_id, TRIM(p_full_name), p_email, p_password_hash, v_role_id);
  SELECT v_user_id AS user_id;
END$$

DROP PROCEDURE IF EXISTS sp_user_touch_login$$
CREATE PROCEDURE sp_user_touch_login(IN p_user_id CHAR(36))
BEGIN
  UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = p_user_id;
END$$

-- Approve: only an active administrator (checked here too, not only in the API).
DROP PROCEDURE IF EXISTS sp_driver_approve$$
CREATE PROCEDURE sp_driver_approve(IN p_driver_id CHAR(36), IN p_user_id CHAR(36))
BEGIN
  DECLARE v_first_name VARCHAR(80);
  DECLARE v_last_name  VARCHAR(80);
  DECLARE v_email      VARCHAR(150);
  DECLARE v_status     VARCHAR(20);
  DECLARE v_role       VARCHAR(20);
  DECLARE v_approved_id TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT r.code INTO v_role
  FROM users u JOIN roles r ON r.id = u.role_id
  WHERE u.id = p_user_id AND u.is_active = 1;
  IF v_role IS NULL OR v_role <> 'administrator' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FORBIDDEN';
  END IF;

  START TRANSACTION;
  SELECT d.first_name, d.last_name, d.email, s.code
    INTO v_first_name, v_last_name, v_email, v_status
  FROM drivers d JOIN driver_statuses s ON s.id = d.status_id
  WHERE d.id = p_driver_id
  FOR UPDATE;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DRIVER_NOT_FOUND';
  END IF;
  IF v_status <> 'pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_PENDING';
  END IF;
  SELECT id INTO v_approved_id FROM driver_statuses WHERE code = 'approved';
  UPDATE drivers
     SET status_id = v_approved_id, approved_at = UTC_TIMESTAMP()
   WHERE id = p_driver_id;
  INSERT INTO driver_logs (driver_id, user_id, full_name, email, status_id, comment)
  VALUES (p_driver_id, p_user_id, CONCAT(v_first_name, ' ', v_last_name), v_email, v_approved_id,
          'Solicitud aprobada, el conductor fue registrado.');
  COMMIT;
  SELECT v_first_name AS first_name, v_last_name AS last_name, v_email AS email;
END$$

-- Reject: only an active administrator. Logs, then deletes the driver (PDFs by CASCADE).
DROP PROCEDURE IF EXISTS sp_driver_reject$$
CREATE PROCEDURE sp_driver_reject(
  IN p_driver_id  CHAR(36),
  IN p_reason     VARCHAR(200),
  IN p_user_id    CHAR(36)
)
BEGIN
  DECLARE v_first_name VARCHAR(80);
  DECLARE v_last_name  VARCHAR(80);
  DECLARE v_email      VARCHAR(150);
  DECLARE v_status     VARCHAR(20);
  DECLARE v_role       VARCHAR(20);
  DECLARE v_rejected_id TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT r.code INTO v_role
  FROM users u JOIN roles r ON r.id = u.role_id
  WHERE u.id = p_user_id AND u.is_active = 1;
  IF v_role IS NULL OR v_role <> 'administrator' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'FORBIDDEN';
  END IF;

  START TRANSACTION;
  SELECT d.first_name, d.last_name, d.email, s.code
    INTO v_first_name, v_last_name, v_email, v_status
  FROM drivers d JOIN driver_statuses s ON s.id = d.status_id
  WHERE d.id = p_driver_id
  FOR UPDATE;
  IF v_status IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DRIVER_NOT_FOUND';
  END IF;
  IF v_status <> 'pending' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'NOT_PENDING';
  END IF;
  SELECT id INTO v_rejected_id FROM driver_statuses WHERE code = 'rejected';
  INSERT INTO driver_logs (driver_id, user_id, full_name, email, status_id, comment)
  VALUES (p_driver_id, p_user_id, CONCAT(v_first_name, ' ', v_last_name), v_email, v_rejected_id,
          LEFT(CONCAT('Solicitud rechazada, el registro fue eliminado.',
                      IF(p_reason IS NULL OR TRIM(p_reason) = '', '',
                         CONCAT(' Motivo: ', TRIM(p_reason)))), 255));
  DELETE FROM drivers WHERE id = p_driver_id;
  COMMIT;
  SELECT v_first_name AS first_name, v_last_name AS last_name, v_email AS email;
END$$

-- Log list now also returns who performed the action (NULL for self-registrations).
DROP PROCEDURE IF EXISTS sp_driver_log_list$$
CREATE PROCEDURE sp_driver_log_list(
  IN p_driver_id  CHAR(36),
  IN p_email      VARCHAR(150)
)
BEGIN
  SELECT l.id, l.driver_id, l.user_id, u.full_name AS user_name,
         l.full_name, l.email,
         s.code AS status_code, s.name AS status_name,
         l.comment, l.created_at
  FROM driver_logs l
  JOIN driver_statuses s ON s.id = l.status_id
  LEFT JOIN users u ON u.id = l.user_id
  WHERE (p_driver_id IS NULL OR l.driver_id = p_driver_id)
    AND (p_email IS NULL OR l.email = LOWER(TRIM(p_email)))
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT 200;
END$$

DELIMITER ;
