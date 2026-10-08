import multer from 'multer';
import { env } from '../config/env.js';
import { DOCUMENTS, MAX_FILES, UPLOAD_FIELDS } from '../constants/documents.js';
import { AppError } from '../utils/app-error.js';
import { isPdfBuffer } from '../utils/pdf.js';

const maxBytes = env.maxFileSizeMb * 1024 * 1024;

const parser = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: MAX_FILES, fields: 20, fieldSize: 10 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new AppError(400, 'Solo se permiten archivos PDF', [
        { field: file.fieldname, message: 'El archivo debe ser un PDF' },
      ]));
    }
    return cb(null, true);
  },
}).fields(UPLOAD_FIELDS);

/** Parses multipart/form-data and translates multer errors to AppError. */
export function uploadDocuments(req, res, next) {
  parser(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const field = err.field || 'files';
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(413, `El archivo supera el tamaño máximo de ${env.maxFileSizeMb} MB`, [
          { field, message: `El archivo no debe superar ${env.maxFileSizeMb} MB` },
        ]));
      }
      const message = err.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'Se envió un archivo no permitido'
        : 'La solicitud de carga de archivos no es válida';
      return next(new AppError(400, message, [{ field, message }]));
    }
    return next(err);
  });
}

/**
 * Ensures required documents exist and are real PDFs (%PDF- header).
 * Exposes the buffers in req.documents keyed by form field (optional ones as null).
 */
export function requireDocuments(req, res, next) {
  const errors = [];
  const documents = {};

  for (const doc of DOCUMENTS) {
    const file = req.files?.[doc.field]?.[0];
    if (!file) {
      if (doc.required) errors.push({ field: doc.field, message: 'Este documento es obligatorio' });
      documents[doc.field] = null;
    } else if (!isPdfBuffer(file.buffer)) {
      errors.push({ field: doc.field, message: 'El archivo no es un PDF válido' });
    } else {
      documents[doc.field] = file.buffer;
    }
  }

  if (errors.length > 0) {
    return next(new AppError(400, 'Faltan documentos o no son válidos', errors));
  }
  req.documents = documents;
  return next();
}
