import { Router, Request, Response } from 'express';
import multer from 'multer';
import { db } from '../db/database';
import { ExcelService } from '../services/excelService';
import { ConflictDetector } from '../services/conflictDetector';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// POST /api/upload - Subir archivo Excel o CSV con asignación de vuelos
router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'No se ha adjuntado ningún archivo (.xlsx, .xls o .csv)' }
      });
    }

    const { flights, errors, totalRows } = ExcelService.parseFile(req.file.buffer, db);

    if (flights.length === 0) {
      return res.status(422).json({
        success: false,
        message: 'No se pudo extraer ningún vuelo válido del archivo.',
        errors,
        totalRows
      });
    }

    // Modalidad de reemplazo o upsert: por defecto hace upsert
    const mode = (req.query.mode as string) || 'upsert';
    if (mode === 'replace') {
      db.bulkReplaceFlights(flights);
    } else {
      db.bulkUpsertFlights(flights);
    }

    // Re-evaluar conflictos con todos los vuelos actualizados
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());

    res.json({
      success: true,
      message: `Procesamiento completado. Se importaron ${flights.length} registros de ${totalRows} filas.`,
      importedCount: flights.length,
      conflictsDetected: conflicts.length,
      conflicts,
      parsingErrors: errors,
      data: evaluatedFlights
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FILE_PROCESSING_ERROR', message: err.message }
    });
  }
});

// GET /api/upload/template - Descargar plantilla oficial en formato Excel
router.get('/template', (_req: Request, res: Response) => {
  try {
    const buffer = ExcelService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Horus_Plantilla_Asignacion_Stands.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'TEMPLATE_GEN_ERROR', message: err.message }
    });
  }
});

export default router;
