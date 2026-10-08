-- =====================================================================
CREATE DATABASE IF NOT EXISTS aquadevs_afrogo_api_dev
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aquadevs_afrogo_api_dev;
SET time_zone = '+00:00';
-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_types (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(20) NOT NULL,
  name  VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vehicle_types_code (code)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS driver_statuses (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(20) NOT NULL,
  name  VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_driver_statuses_code (code)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS drivers (
  id               CHAR(36) NOT NULL DEFAULT (UUID()),
  first_name       VARCHAR(80)  NOT NULL,
  last_name        VARCHAR(80)  NOT NULL,
  phone            VARCHAR(9)   NOT NULL,
  email            VARCHAR(150) NOT NULL,
  dni              CHAR(8)      NOT NULL,
  vehicle_type_id  TINYINT UNSIGNED NOT NULL,
  status_id        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  approved_at      DATETIME NULL,
  created_at       DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_drivers_phone (phone),
  UNIQUE KEY uq_drivers_email (email),
  UNIQUE KEY uq_drivers_dni (dni),
  KEY ix_drivers_status (status_id),
  CONSTRAINT fk_drivers_vehicle_type FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types (id),
  CONSTRAINT fk_drivers_status FOREIGN KEY (status_id) REFERENCES driver_statuses (id),
  CONSTRAINT ck_drivers_phone CHECK (phone REGEXP '^9[0-9]{8}$'),
  CONSTRAINT ck_drivers_dni CHECK (dni REGEXP '^[0-9]{8}$')
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS driver_documents (
  id               CHAR(36) NOT NULL DEFAULT (UUID()),
  driver_id                 CHAR(36) NOT NULL,
  soat_pdf                  LONGBLOB NOT NULL,
  technical_inspection_pdf  LONGBLOB NOT NULL,
  driver_license_pdf        LONGBLOB NOT NULL,
  dni_pdf                   LONGBLOB NOT NULL,
  labor_certificate_pdf     LONGBLOB NOT NULL,
  vehicle_photo_front_pdf   LONGBLOB NOT NULL,
  vehicle_photo_back_pdf    LONGBLOB NOT NULL,
  tinted_permit_pdf         LONGBLOB NULL,
  created_at                DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_driver_documents_driver (driver_id),
  CONSTRAINT fk_driver_documents_driver FOREIGN KEY (driver_id)
    REFERENCES drivers (id) ON DELETE CASCADE
) ENGINE=InnoDB;
-- driver_id has NO foreign key on purpose: logs survive the driver's deletion.
CREATE TABLE IF NOT EXISTS driver_logs (
  id               CHAR(36) NOT NULL DEFAULT (UUID()),
  driver_id   CHAR(36) NOT NULL,
  full_name   VARCHAR(160) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  status_id   TINYINT UNSIGNED NOT NULL,
  comment     VARCHAR(255) NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT (UTC_TIMESTAMP(3)),
  PRIMARY KEY (id),
  KEY ix_driver_logs_driver (driver_id),
  KEY ix_driver_logs_email (email),
  CONSTRAINT fk_driver_logs_status FOREIGN KEY (status_id) REFERENCES driver_statuses (id)
) ENGINE=InnoDB;
-- ---------------------------------------------------------------------
-- SEED DATA (static catalogs)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO driver_statuses (id, code, name) VALUES
  (1, 'pending',  'Pendiente'),
  (2, 'approved', 'Aprobado'),
  (3, 'rejected', 'Rechazado');
INSERT IGNORE INTO vehicle_types (id, code, name) VALUES
  (1, 'car',        'Auto'),
  (2, 'mototaxi',   'Mototaxi'),
  (3, 'motorcycle', 'Moto lineal');
-- ---------------------------------------------------------------------
-- STORED PROCEDURES
-- ---------------------------------------------------------------------
DELIMITER $$
-- GET /api/vehicle-types
DROP PROCEDURE IF EXISTS sp_vehicle_type_list$$
CREATE PROCEDURE sp_vehicle_type_list()
BEGIN
  SELECT id, code, name FROM vehicle_types ORDER BY id;
END$$
-- POST /api/drivers (step 1). Runs inside the Node transaction.
DROP PROCEDURE IF EXISTS sp_driver_register$$
CREATE PROCEDURE sp_driver_register(
  IN p_first_name       VARCHAR(80),
  IN p_last_name        VARCHAR(80),
  IN p_phone            VARCHAR(9),
  IN p_email            VARCHAR(150),
  IN p_dni              CHAR(8),
  IN p_vehicle_type_id  TINYINT UNSIGNED
)
BEGIN
  DECLARE v_driver_id CHAR(36);
  DECLARE EXIT HANDLER FOR 1062
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_DATA';
  SET p_email = LOWER(TRIM(p_email));
  IF NOT EXISTS (SELECT 1 FROM vehicle_types WHERE id = p_vehicle_type_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_VEHICLE_TYPE';
  END IF;
  IF EXISTS (SELECT 1 FROM drivers WHERE phone = p_phone) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_PHONE';
  END IF;
  IF EXISTS (SELECT 1 FROM drivers WHERE email = p_email) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_EMAIL';
  END IF;
  IF EXISTS (SELECT 1 FROM drivers WHERE dni = p_dni) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DUPLICATE_DNI';
  END IF;
  SET v_driver_id = UUID();
  INSERT INTO drivers (id, first_name, last_name, phone, email, dni, vehicle_type_id, status_id)
  VALUES (v_driver_id, TRIM(p_first_name), TRIM(p_last_name), p_phone, p_email, p_dni, p_vehicle_type_id,
          (SELECT id FROM driver_statuses WHERE code = 'pending'));
  INSERT INTO driver_logs (driver_id, full_name, email, status_id, comment)
  VALUES (v_driver_id, CONCAT(TRIM(p_first_name), ' ', TRIM(p_last_name)), p_email,
          (SELECT id FROM driver_statuses WHERE code = 'pending'),
          'Solicitud registrada, en estado pendiente.');
  SELECT v_driver_id AS driver_id;
END$$
-- POST /api/drivers (step 2). Runs inside the Node transaction.
DROP PROCEDURE IF EXISTS sp_driver_documents_save$$
CREATE PROCEDURE sp_driver_documents_save(
  IN p_driver_id                  CHAR(36),
  IN p_soat_pdf                   LONGBLOB,
  IN p_technical_inspection_pdf   LONGBLOB,
  IN p_driver_license_pdf         LONGBLOB,
  IN p_dni_pdf                    LONGBLOB,
  IN p_labor_certificate_pdf      LONGBLOB,
  IN p_vehicle_photo_front_pdf    LONGBLOB,
  IN p_vehicle_photo_back_pdf     LONGBLOB,
  IN p_tinted_permit_pdf          LONGBLOB
)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM drivers WHERE id = p_driver_id) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'DRIVER_NOT_FOUND';
  END IF;
  INSERT INTO driver_documents (
    driver_id, soat_pdf, technical_inspection_pdf, driver_license_pdf, dni_pdf,
    labor_certificate_pdf, vehicle_photo_front_pdf, vehicle_photo_back_pdf, tinted_permit_pdf
  ) VALUES (
    p_driver_id, p_soat_pdf, p_technical_inspection_pdf, p_driver_license_pdf, p_dni_pdf,
    p_labor_certificate_pdf, p_vehicle_photo_front_pdf, p_vehicle_photo_back_pdf, p_tinted_permit_pdf
  );
END$$
-- GET /api/internal/drivers?status=pending  (p_status_code NULL = all). No PDFs.
DROP PROCEDURE IF EXISTS sp_driver_list$$
CREATE PROCEDURE sp_driver_list(IN p_status_code VARCHAR(20))
BEGIN
  SELECT d.id, d.first_name, d.last_name, d.phone, d.email, d.dni,
         vt.code AS vehicle_type_code, vt.name AS vehicle_type_name,
         s.code AS status_code, s.name AS status_name,
         d.approved_at, d.created_at
  FROM drivers d
  JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
  JOIN driver_statuses s ON s.id = d.status_id
  WHERE p_status_code IS NULL OR s.code = p_status_code
  ORDER BY d.created_at DESC, d.id DESC;
END$$
-- GET /api/internal/drivers/:id  (empty result set = 404). No PDFs, only flags.
DROP PROCEDURE IF EXISTS sp_driver_get$$
CREATE PROCEDURE sp_driver_get(IN p_driver_id CHAR(36))
BEGIN
  SELECT d.id, d.first_name, d.last_name, d.phone, d.email, d.dni,
         vt.code AS vehicle_type_code, vt.name AS vehicle_type_name,
         s.code AS status_code, s.name AS status_name,
         d.approved_at, d.created_at,
         (SELECT tinted_permit_pdf IS NOT NULL FROM driver_documents
           WHERE driver_id = d.id) AS has_tinted_permit
  FROM drivers d
  JOIN vehicle_types vt ON vt.id = d.vehicle_type_id
  JOIN driver_statuses s ON s.id = d.status_id
  WHERE d.id = p_driver_id;
END$$
-- GET /api/internal/drivers/:id/documents/:type  (returns ONE column only)
DROP PROCEDURE IF EXISTS sp_driver_document_get$$
CREATE PROCEDURE sp_driver_document_get(
  IN p_driver_id      CHAR(36),
  IN p_document_code  VARCHAR(40)
)
BEGIN
  IF p_document_code NOT IN ('soat','technical_inspection','driver_license','dni',
      'labor_certificate','vehicle_photo_front','vehicle_photo_back','tinted_permit') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'INVALID_DOCUMENT';
  END IF;
  SELECT CASE p_document_code
           WHEN 'soat'                 THEN soat_pdf
           WHEN 'technical_inspection' THEN technical_inspection_pdf
           WHEN 'driver_license'       THEN driver_license_pdf
           WHEN 'dni'                  THEN dni_pdf
           WHEN 'labor_certificate'    THEN labor_certificate_pdf
           WHEN 'vehicle_photo_front'  THEN vehicle_photo_front_pdf
           WHEN 'vehicle_photo_back'   THEN vehicle_photo_back_pdf
           WHEN 'tinted_permit'        THEN tinted_permit_pdf
         END AS file_data
  FROM driver_documents
  WHERE driver_id = p_driver_id;
END$$
-- POST /api/internal/drivers/:id/approve  (standalone, own transaction)
DROP PROCEDURE IF EXISTS sp_driver_approve$$
CREATE PROCEDURE sp_driver_approve(IN p_driver_id CHAR(36))
BEGIN
  DECLARE v_first_name VARCHAR(80);
  DECLARE v_last_name  VARCHAR(80);
  DECLARE v_email      VARCHAR(150);
  DECLARE v_status     VARCHAR(20);
  DECLARE v_approved_id TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
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
  INSERT INTO driver_logs (driver_id, full_name, email, status_id, comment)
  VALUES (p_driver_id, CONCAT(v_first_name, ' ', v_last_name), v_email, v_approved_id,
          'Solicitud aprobada, el conductor fue registrado.');
  COMMIT;
  SELECT v_first_name AS first_name, v_last_name AS last_name, v_email AS email;
END$$
-- POST /api/internal/drivers/:id/reject  (standalone: log + delete)
DROP PROCEDURE IF EXISTS sp_driver_reject$$
CREATE PROCEDURE sp_driver_reject(
  IN p_driver_id  CHAR(36),
  IN p_reason     VARCHAR(200)
)
BEGIN
  DECLARE v_first_name VARCHAR(80);
  DECLARE v_last_name  VARCHAR(80);
  DECLARE v_email      VARCHAR(150);
  DECLARE v_status     VARCHAR(20);
  DECLARE v_rejected_id TINYINT UNSIGNED;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;
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
  INSERT INTO driver_logs (driver_id, full_name, email, status_id, comment)
  VALUES (p_driver_id, CONCAT(v_first_name, ' ', v_last_name), v_email, v_rejected_id,
          LEFT(CONCAT('Solicitud rechazada, el registro fue eliminado.',
                      IF(p_reason IS NULL OR TRIM(p_reason) = '', '',
                         CONCAT(' Motivo: ', TRIM(p_reason)))), 255));
  DELETE FROM drivers WHERE id = p_driver_id;   -- documents deleted by CASCADE
  COMMIT;
  SELECT v_first_name AS first_name, v_last_name AS last_name, v_email AS email;
END$$
-- GET /api/internal/driver-logs?driverId=&email=  (optional filters)
DROP PROCEDURE IF EXISTS sp_driver_log_list$$
CREATE PROCEDURE sp_driver_log_list(
  IN p_driver_id  CHAR(36),
  IN p_email      VARCHAR(150)
)
BEGIN
  SELECT l.id, l.driver_id, l.full_name, l.email,
         s.code AS status_code, s.name AS status_name,
         l.comment, l.created_at
  FROM driver_logs l
  JOIN driver_statuses s ON s.id = l.status_id
  WHERE (p_driver_id IS NULL OR l.driver_id = p_driver_id)
    AND (p_email IS NULL OR l.email = LOWER(TRIM(p_email)))
  ORDER BY l.created_at DESC, l.id DESC
  LIMIT 200;
END$$
DELIMITER ;
