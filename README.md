# afrogo-api

API de **recepción** de postulaciones de conductores de AfroGo (taxi, Chincha, Ica, Perú).
Recibe datos y PDF desde la web y los guarda en MySQL. Otra API externa consulta, aprueba o rechaza las postulaciones usando `x-api-key`. Esta API no tiene login ni JWT.

## Requisitos

- Node.js 20+
- **MySQL 8.0.16+** (necesario para las restricciones `CHECK`)
- **`max_allowed_packet` ≥ 64 MB** (hasta 8 PDF de 5 MB por solicitud). En `my.cnf`:
  ```ini
  [mysqld]
  max_allowed_packet=64M
  ```

## Instalación

```bash
npm install
cp .env.example .env            # completa los valores
mysql -u root -p < sql/afrogo_driver_intake.sql
npm run dev                     # desarrollo (--watch)
npm start                       # producción
```

### Variables de entorno

Ver `.env.example`. `TRUST_PROXY` (0 = apagado) debe ser `1` si la API está detrás de un proxy inverso, para que el límite por IP funcione bien. `SMTP_PASSWORD` es una **contraseña de aplicación** de Gmail (cuenta `afrogochincha@gmail.com`, con verificación en dos pasos).

### API key interna

Genera la clave y colócala en `INTERNAL_API_KEY`:

```bash
openssl rand -hex 32
```

La otra API debe enviarla en **todas** las peticiones a `/api/internal/*` con el header `x-api-key`. Si falta o no coincide: `401 { "success": false, "message": "No autorizado" }`. Guárdala solo en variables de entorno del servidor (nunca en el front-end).

## Formato de respuesta

```json
{ "success": true, "message": "...", "data": {}, "errors": [] }
```

`errors` = `[{ "field": "phone", "message": "..." }]` cuando aplica.

| Código | Caso |
| --- | --- |
| 400 | Datos o archivos inválidos, documento obligatorio faltante, tipo no permitido |
| 401 | API key ausente o incorrecta |
| 404 | Conductor o documento no encontrado |
| 409 | Celular, correo o DNI duplicado; solicitud ya procesada |
| 413 | Archivo mayor a `MAX_FILE_SIZE_MB` |
| 429 | Límite de solicitudes superado |
| 500 | Error interno (sin detalles) |

## Endpoints y ejemplos

Reemplaza `BASE=http://localhost:3000`, `KEY=<tu INTERNAL_API_KEY>` e `ID=<driverId>`.

### Públicos

```bash
# Salud
curl $BASE/api/health

# Tipos de vehículo
curl $BASE/api/vehicle-types

# Registrar postulación (7 PDF obligatorios; tintedPermit es opcional)
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

Límite: 5 solicitudes por hora por IP.

### Internos (header `x-api-key`)

```bash
# Listar (status opcional: pending | approved)
curl -H "x-api-key: $KEY" "$BASE/api/internal/drivers?status=pending"

# Detalle
curl -H "x-api-key: $KEY" $BASE/api/internal/drivers/$ID

# Descargar PDF (soat, technical_inspection, driver_license, dni, labor_certificate,
# vehicle_photo_front, vehicle_photo_back, tinted_permit)
curl -H "x-api-key: $KEY" -o soat-$ID.pdf $BASE/api/internal/drivers/$ID/documents/soat

# Aprobar (envía correo "aprobado")
curl -X POST -H "x-api-key: $KEY" $BASE/api/internal/drivers/$ID/approve

# Rechazar (elimina al conductor y sus PDF; envía correo "rechazado"; reason opcional ≤ 200)
curl -X POST -H "x-api-key: $KEY" -H "Content-Type: application/json" \
  -d '{"reason":"La licencia está vencida"}' $BASE/api/internal/drivers/$ID/reject

# Bitácora (filtros opcionales)
curl -H "x-api-key: $KEY" "$BASE/api/internal/driver-logs?driverId=$ID&email=juan@gmail.com"
```

Ejemplo desde Node (la otra API):

```js
const res = await fetch(`${process.env.AFROGO_API_URL}/api/internal/drivers?status=pending`, {
  headers: { 'x-api-key': process.env.AFROGO_INTERNAL_API_KEY },
});
```

## Notas

- Todo acceso a datos usa `CALL sp_...` parametrizado, solo en `src/repositories/driver.repository.js` (excepción: `SELECT 1` en `/api/health`). Fechas en UTC.
- Los PDF nunca se registran en logs ni se exponen en JSON; solo se sirven por el endpoint de documentos.
- Si falla el envío de correo, solo se registra en consola; el flujo continúa.
