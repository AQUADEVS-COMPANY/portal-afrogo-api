# afrogo-api

API de AfroGo (taxi, Chincha, Ica, Perú): **recepción** de postulaciones de conductores (pública) y **panel interno** (login con JWT) para revisar documentos, aprobar o rechazar.

## Requisitos

- Node.js 20+
- **MySQL 8.0.16+** (restricciones `CHECK`)
- **`max_allowed_packet` ≥ 64 MB** (hasta 8 PDF de 5 MB por solicitud). En `my.cnf`/`my.ini`:
  ```ini
  [mysqld]
  max_allowed_packet=64M
  ```

## Instalación

```bash
npm install
cp .env.example .env            # completa los valores
```

Ejecuta **en este orden** en MySQL Workbench (o por consola):

1. `sql/aquadevs_afrogo_api_dev.sql` (tablas base y procedimientos)
2. `sql/002_auth_roles.sql` (usuarios, roles, `driver_logs.user_id`, procedimientos de aprobar/rechazar con validación de rol)

```bash
npm run dev                     # desarrollo (--watch)
npm start                       # producción
```

### Variables de entorno

Ver `.env.example`. `TRUST_PROXY` (0 = apagado) debe ser `1` detrás de un proxy inverso. `SMTP_PASSWORD` es una **contraseña de aplicación** de Gmail.

Genera `JWT_SECRET` (mínimo 32 caracteres):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`JWT_EXPIRES_IN` define la duración del token (por defecto `5h`; ej.: `30m`, `8h`, `1d`).

## Usuarios y roles

No hay registro público. Crea los usuarios por consola:

```bash
npm run create-user -- admin@afrogo.pe "Nombre Apellido" "ClaveSegura123" administrator
npm run create-user -- secretaria@afrogo.pe "Nombre Apellido" "ClaveSegura123" secretary
```

| Rol | Permisos |
| --- | --- |
| `administrator` | Ver lista, detalle, PDF y bitácora; **aprobar y rechazar** |
| `secretary` | Solo ver lista, detalle, PDF y bitácora |

Seguridad por capas: el front oculta botones, la API responde `403` y los procedimientos `sp_driver_approve` / `sp_driver_reject` también rechazan (`FORBIDDEN`) si el usuario no es un administrador activo. El rol y el estado activo se leen de la BD en cada petición.

## Zona horaria

La BD guarda en UTC. Envía el header `x-timezone` (nombre IANA, ej. `America/Lima`) en `/api/admin/*` y las fechas se devuelven convertidas: `createdAt` (ISO con offset, ej. `2026-10-08T14:30:00.000-05:00`) y `createdAtDisplay` (`08/10/2026 02:30 p. m.`). Si falta o es inválido, se usa `America/Lima`. En el navegador: `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Formato de respuesta

```json
{ "success": true, "message": "...", "data": {}, "errors": [] }
```

`errors` = `[{ "field": "phone", "message": "..." }]` cuando aplica.

| Código | Caso |
| --- | --- |
| 400 | Datos o archivos inválidos, documento obligatorio faltante, tipo no permitido |
| 401 | Credenciales incorrectas, token ausente, inválido o expirado |
| 403 | El rol no tiene permiso (aprobar/rechazar) |
| 404 | Conductor o documento no encontrado |
| 409 | Celular, correo o DNI duplicado; solicitud ya procesada |
| 413 | Archivo mayor a `MAX_FILE_SIZE_MB` |
| 429 | Límite de solicitudes superado |
| 500 | Error interno (sin detalles) |

## Endpoints y ejemplos

Reemplaza `BASE=http://localhost:3000`, `TOKEN=<token del login>` e `ID=<driverId>`.

### Públicos

```bash
curl $BASE/api/health
curl $BASE/api/vehicle-types

# Registrar postulación (7 PDF obligatorios; tintedPermit es opcional). 5 por hora por IP
curl -X POST $BASE/api/drivers \
  -F firstName="Juan Carlos" -F lastName="Quispe Huamán" \
  -F dni=12345678 -F phone=987654321 -F email=juan@gmail.com -F vehicleTypeId=1 \
  -F soat=@soat.pdf \
  -F technicalInspection=@revision-tecnica.pdf \
  -F driverLicense=@licencia.pdf \
  -F dniCopy=@dni.pdf \
  -F laborCertificate=@certificado-laboral.pdf \
  -F vehiclePhotoFront=@foto-adverso.pdf \
  -F vehiclePhotoBack=@foto-reverso.pdf \
  -F tintedPermit=@permiso-luna.pdf
```

### Autenticación

```bash
# Login (5 intentos fallidos / 15 min por IP). Devuelve { token, expiresAt, user }
curl -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@afrogo.pe","password":"ClaveSegura123"}'

# Usuario actual
curl -H "Authorization: Bearer $TOKEN" $BASE/api/auth/me
```

### Panel (header `Authorization: Bearer <token>`)

```bash
H1="Authorization: Bearer $TOKEN"; H2="x-timezone: America/Lima"

# Listar (status opcional: pending | approved)
curl -H "$H1" -H "$H2" "$BASE/api/admin/drivers?status=pending"

# Detalle (incluye "documents": code, label, required, url)
curl -H "$H1" -H "$H2" $BASE/api/admin/drivers/$ID

# PDF (soat, technical_inspection, driver_license, dni, labor_certificate,
# vehicle_photo_front, vehicle_photo_back, tinted_permit)
curl -H "$H1" -o soat-$ID.pdf $BASE/api/admin/drivers/$ID/documents/soat

# Bitácora (filtros opcionales; incluye quién aprobó o rechazó)
curl -H "$H1" -H "$H2" "$BASE/api/admin/driver-logs?driverId=$ID&email=juan@gmail.com"

# Solo administrador: aprobar (envía correo "aprobado")
curl -X POST -H "$H1" $BASE/api/admin/drivers/$ID/approve

# Solo administrador: rechazar (elimina al conductor y sus PDF; envía correo "rechazado"; reason opcional ≤ 200)
curl -X POST -H "$H1" -H "Content-Type: application/json" \
  -d '{"reason":"La licencia está vencida"}' $BASE/api/admin/drivers/$ID/reject
```

Desde un front web, los PDF se piden con `fetch` + header `Authorization` y se muestran con `URL.createObjectURL(blob)` (un `<iframe src>` directo no envía el token).

## Notas

- Todo acceso a datos usa `CALL sp_...` parametrizado, solo en `src/repositories/` (excepción: `SELECT 1` en `/api/health`).
- Los PDF nunca se registran en logs ni se exponen en JSON; solo se sirven por el endpoint de documentos con JWT.
- Si falla el envío de correo, solo se registra en consola; el flujo continúa.
- El rechazo elimina al conductor y sus PDF; quedan la bitácora (con el usuario que lo hizo) y el correo.
