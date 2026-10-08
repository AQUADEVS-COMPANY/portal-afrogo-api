const PDF_SIGNATURE = Buffer.from('%PDF-');

/**
 * Checks the real file header, not just the declared mimetype.
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export function isPdfBuffer(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= PDF_SIGNATURE.length
    && buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
}
