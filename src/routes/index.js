import { Router } from 'express';
import { pingDatabase } from '../config/database.js';
import { apiKey } from '../middlewares/api-key.js';
import { ApiResponse } from '../models/dto/response/api.response.js';
import driverRoutes from './driver.routes.js';
import internalRoutes from './internal.routes.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await pingDatabase();
    res.json(ApiResponse.ok('Servicio disponible', { status: 'ok' }));
  } catch {
    res.status(503).json(ApiResponse.fail('Servicio no disponible'));
  }
});

router.use(driverRoutes);
router.use('/internal', apiKey, internalRoutes);

export default router;
