import { Router } from 'express';
import { listVehicleTypes, registerDriver } from '../controllers/driver.controller.js';
import { registerLimiter } from '../middlewares/rate-limiter.js';
import { uploadDocuments, requireDocuments } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { registerDriverSchema } from '../validators/driver.schema.js';

const router = Router();

router.get('/vehicle-types', listVehicleTypes);
router.post(
  '/drivers',
  registerLimiter,
  uploadDocuments,
  validate(registerDriverSchema, 'body'),
  requireDocuments,
  registerDriver,
);

export default router;
