import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { ConflictDetector } from '../services/conflictDetector';
import { FlightAllocation } from '../db/schema';

const router = Router();

// GET /api/flights - Obtiene todos los vuelos con estado de conflicto calculado en vivo
router.get('/', (_req: Request, res: Response) => {
  try {
    const rawFlights = db.getFlights();
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(rawFlights);

    res.json({
      success: true,
      total: evaluatedFlights.length,
      conflictsCount: conflicts.length,
      conflicts,
      data: evaluatedFlights
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLIGHTS_FETCH_ERROR', message: err.message }
    });
  }
});

// POST /api/flights - Crear un nuevo vuelo
router.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.inboundFlight || !body.scheduledArrival || !body.scheduledDeparture) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'inboundFlight, scheduledArrival y scheduledDeparture son requeridos' }
      });
    }

    const newFlight: FlightAllocation = {
      id: body.id || `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inboundFlight: body.inboundFlight.toUpperCase(),
      outboundFlight: body.outboundFlight ? body.outboundFlight.toUpperCase() : undefined,
      airlineCode: (body.airlineCode || body.inboundFlight.slice(0, 2)).toUpperCase(),
      airlineName: body.airlineName || 'Aerolínea',
      aircraftType: (body.aircraftType || 'A320').toUpperCase(),
      registration: body.registration ? body.registration.toUpperCase() : undefined,
      origin: body.origin ? body.origin.toUpperCase() : undefined,
      destination: body.destination ? body.destination.toUpperCase() : undefined,
      standId: body.standId || 'UNASSIGNED',
      scheduledArrival: body.scheduledArrival,
      scheduledDeparture: body.scheduledDeparture,
      status: body.status || 'SCHEDULED',
      notes: body.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveFlight(newFlight);
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());
    const savedWithConflicts = evaluatedFlights.find(f => f.id === saved.id) || saved;

    res.status(201).json({
      success: true,
      data: savedWithConflicts,
      conflicts
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLIGHT_CREATE_ERROR', message: err.message }
    });
  }
});

// PUT /api/flights/:id - Actualizar vuelo existente
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.getFlightById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLIGHT_NOT_FOUND', message: `Vuelo ${id} no encontrado` }
      });
    }

    const updatedFlight: FlightAllocation = {
      ...existing,
      ...req.body,
      id, // Prevenir mutación de ID
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveFlight(updatedFlight);
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());
    const savedWithConflicts = evaluatedFlights.find(f => f.id === saved.id) || saved;

    res.json({
      success: true,
      data: savedWithConflicts,
      conflicts
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLIGHT_UPDATE_ERROR', message: err.message }
    });
  }
});

// PATCH /api/flights/:id/move - Operación rápida de Drag & Drop (Mover stand y/o ajustar horas)
router.patch('/:id/move', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newStandId, newScheduledArrival, newScheduledDeparture } = req.body;

    const existing = db.getFlightById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLIGHT_NOT_FOUND', message: `Vuelo ${id} no encontrado` }
      });
    }

    if (newStandId) {
      existing.standId = newStandId;
    }
    if (newScheduledArrival) {
      existing.scheduledArrival = newScheduledArrival;
    }
    if (newScheduledDeparture) {
      existing.scheduledDeparture = newScheduledDeparture;
    }

    existing.updatedAt = new Date().toISOString();
    const saved = db.saveFlight(existing);

    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());
    const savedWithConflicts = evaluatedFlights.find(f => f.id === saved.id) || saved;

    res.json({
      success: true,
      data: savedWithConflicts,
      conflicts
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLIGHT_MOVE_ERROR', message: err.message }
    });
  }
});

// DELETE /api/flights/:id - Eliminar vuelo
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteFlight(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'FLIGHT_NOT_FOUND', message: `Vuelo ${id} no encontrado` }
      });
    }

    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());

    res.json({
      success: true,
      message: `Vuelo ${id} eliminado con éxito`,
      totalRemaining: evaluatedFlights.length,
      conflicts
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FLIGHT_DELETE_ERROR', message: err.message }
    });
  }
});

// POST /api/flights/reset - Restaurar datos iniciales de demostración
router.post('/reset', (_req: Request, res: Response) => {
  try {
    db.resetToDefault();
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(db.getFlights());

    res.json({
      success: true,
      message: 'Base de datos restaurada a valores iniciales de prueba.',
      total: evaluatedFlights.length,
      conflicts,
      data: evaluatedFlights
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'RESET_ERROR', message: err.message }
    });
  }
});

export default router;
