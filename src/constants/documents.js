/**
 * Document catalog: form field -> database column -> internal endpoint code.
 * The order matches the parameters of sp_driver_documents_save.
 */
export const DOCUMENTS = Object.freeze([
  { field: 'soat', column: 'soat_pdf', code: 'soat', required: true },
  { field: 'technicalInspection', column: 'technical_inspection_pdf', code: 'technical_inspection', required: true },
  { field: 'driverLicense', column: 'driver_license_pdf', code: 'driver_license', required: true },
  { field: 'dniCopy', column: 'dni_pdf', code: 'dni', required: true },
  { field: 'laborCertificate', column: 'labor_certificate_pdf', code: 'labor_certificate', required: true },
  { field: 'vehiclePhotoFront', column: 'vehicle_photo_front_pdf', code: 'vehicle_photo_front', required: true },
  { field: 'vehiclePhotoBack', column: 'vehicle_photo_back_pdf', code: 'vehicle_photo_back', required: true },
  { field: 'tintedPermit', column: 'tinted_permit_pdf', code: 'tinted_permit', required: false },
]);

export const DOCUMENT_CODES = DOCUMENTS.map((doc) => doc.code);

/** multer .fields() configuration (one file per field, max 8 files). */
export const UPLOAD_FIELDS = DOCUMENTS.map((doc) => ({ name: doc.field, maxCount: 1 }));

export const MAX_FILES = DOCUMENTS.length;
