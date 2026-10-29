import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// GET /api/stands - Lista todos los stands configurados
router.get('/', (_req: Request, res: Response) => {
  try {
    const stands = db.getStands();
    res.json({
      success: true,
      total: stands.length,
      data: stands
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'STANDS_FETCH_ERROR', message: err.message }
    });
  }
});

export default router;
