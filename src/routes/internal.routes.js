import { Router } from 'express';
import {
  listDrivers, getDriver, getDocument, approveDriver, rejectDriver, listDriverLogs,
} from '../controllers/internal.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  listDriversQuerySchema, driverIdParamSchema, documentParamSchema, rejectDriverSchema, driverLogQuerySchema,
} from '../validators/driver.schema.js';

const router = Router();

router.get('/drivers', validate(listDriversQuerySchema, 'query'), listDrivers);
router.get('/drivers/:id', validate(driverIdParamSchema, 'params'), getDriver);
router.get('/drivers/:id/documents/:type', validate(documentParamSchema, 'params'), getDocument);
router.post('/drivers/:id/approve', validate(driverIdParamSchema, 'params'), approveDriver);
router.post(
  '/drivers/:id/reject',
  validate(driverIdParamSchema, 'params'),
  validate(rejectDriverSchema, 'body'),
  rejectDriver,
);
router.get('/driver-logs', validate(driverLogQuerySchema, 'query'), listDriverLogs);

export default router;
