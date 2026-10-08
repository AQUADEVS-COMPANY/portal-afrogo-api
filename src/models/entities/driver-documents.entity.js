/** Row of `driver_documents`. Holds PDF buffers: never expose it directly. */
export class DriverDocuments {
  constructor(props) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.soatPdf = props.soatPdf;
    this.technicalInspectionPdf = props.technicalInspectionPdf;
    this.driverLicensePdf = props.driverLicensePdf;
    this.dniPdf = props.dniPdf;
    this.laborCertificatePdf = props.laborCertificatePdf;
    this.vehiclePhotoFrontPdf = props.vehiclePhotoFrontPdf;
    this.vehiclePhotoBackPdf = props.vehiclePhotoBackPdf;
    this.tintedPermitPdf = props.tintedPermitPdf;
    this.createdAt = props.createdAt;
  }

  /** @param {object} row snake_case DB row. */
  static fromRow(row) {
    return new DriverDocuments({
      id: row.id,
      driverId: row.driver_id,
      soatPdf: row.soat_pdf,
      technicalInspectionPdf: row.technical_inspection_pdf,
      driverLicensePdf: row.driver_license_pdf,
      dniPdf: row.dni_pdf,
      laborCertificatePdf: row.labor_certificate_pdf,
      vehiclePhotoFrontPdf: row.vehicle_photo_front_pdf,
      vehiclePhotoBackPdf: row.vehicle_photo_back_pdf,
      tintedPermitPdf: row.tinted_permit_pdf,
      createdAt: row.created_at,
    });
  }
}
