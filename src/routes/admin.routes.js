import { Router } from 'express';
import {
  listDrivers, getDriver, getDocument, approveDriver, rejectDriver, listDriverLogs,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth-jwt.js';
import { requireRole } from '../middlewares/require-role.js';
import { timezone } from '../middlewares/timezone.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  listDriversQuerySchema, driverIdParamSchema, documentParamSchema, rejectDriverSchema, driverLogQuerySchema,
} from '../validators/driver.schema.js';

const router = Router();

router.use(authenticate, timezone);

// Any authenticated user (administrator, secretary): read-only.
router.get('/drivers', validate(listDriversQuerySchema, 'query'), listDrivers);
router.get('/drivers/:id', validate(driverIdParamSchema, 'params'), getDriver);
router.get('/drivers/:id/documents/:type', validate(documentParamSchema, 'params'), getDocument);
router.get('/driver-logs', validate(driverLogQuerySchema, 'query'), listDriverLogs);

// Administrator only (also enforced inside the stored procedures).
router.post(
  '/drivers/:id/approve',
  requireRole(ROLES.ADMINISTRATOR),
  validate(driverIdParamSchema, 'params'),
  approveDriver,
);
router.post(
  '/drivers/:id/reject',
  requireRole(ROLES.ADMINISTRATOR),
  validate(driverIdParamSchema, 'params'),
  validate(rejectDriverSchema, 'body'),
  rejectDriver,
);

export default router;
