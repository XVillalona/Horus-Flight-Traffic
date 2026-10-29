import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { RedashService } from '../services/redashService';

const router = Router();
const redashService = RedashService.getInstance(db);

// GET o POST /api/sync/redash - Dispara sincronización inmediata con Redash PUJ
const handleSync = async (req: Request, res: Response) => {
  try {
    const mode = (req.query.mode as 'replace' | 'upsert') || (req.body?.mode as 'replace' | 'upsert') || 'replace';
    const result = await redashService.syncNow(mode);
    
    res.json({
      success: true,
      message: result.message,
      flightsCount: result.flights.length,
      totalDatasetRows: result.totalDatasetRows,
      terminalBCount: result.terminalBCount,
      discardedCount: result.discardedCount,
      conflictsCount: result.conflictsCount,
      standChanges: result.standChanges,
      status: redashService.getStatus(),
      data: result.flights
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REDASH_SYNC_ERROR',
        message: err.message
      },
      status: redashService.getStatus()
    });
  }
};

router.post('/redash', handleSync);
router.get('/redash', handleSync);

// GET /api/sync/status - Devuelve el estado actual de la sincronización
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: redashService.getStatus(),
    config: redashService.getConfig()
  });
});

// POST /api/sync/config - Actualiza configuración de sincronización (intervalo, api key, etc.)
router.post('/config', (req: Request, res: Response) => {
  try {
    const { autoSyncIntervalMinutes, apiKey, email, password } = req.body;
    redashService.updateConfig({
      ...(autoSyncIntervalMinutes !== undefined ? { autoSyncIntervalMinutes: Number(autoSyncIntervalMinutes) } : {}),
      ...(apiKey ? { apiKey } : {}),
      ...(email ? { email } : {}),
      ...(password ? { password } : {})
    });

    res.json({
      success: true,
      message: 'Configuración de sincronización actualizada con éxito.',
      status: redashService.getStatus(),
      config: redashService.getConfig()
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'CONFIG_UPDATE_ERROR', message: err.message }
    });
  }
});

export default router;
