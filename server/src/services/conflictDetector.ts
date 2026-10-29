import { FlightAllocation, ConflictRecord } from '../db/schema';

export class ConflictDetector {
  /**
   * Analiza todos los vuelos y detecta solapamientos temporales en el mismo stand.
   * Los vuelos en "UNASSIGNED" no generan conflicto.
   */
  public static evaluateConflicts(flights: FlightAllocation[]): {
    evaluatedFlights: FlightAllocation[];
    conflicts: ConflictRecord[];
  } {
    const conflicts: ConflictRecord[] = [];
    const flightConflictMap = new Map<string, string[]>();

    // Agrupar vuelos por stand
    const standMap = new Map<string, FlightAllocation[]>();
    for (const flight of flights) {
      if (!flight.standId || flight.standId === 'UNASSIGNED') {
        continue;
      }
      const list = standMap.get(flight.standId) || [];
      list.push(flight);
      standMap.set(flight.standId, list);
    }

    // Evaluar cada stand
    for (const [standId, standFlights] of standMap.entries()) {
      for (let i = 0; i < standFlights.length; i++) {
        for (let j = i + 1; j < standFlights.length; j++) {
          const f1 = standFlights[i];
          const f2 = standFlights[j];

          const start1 = new Date(f1.scheduledArrival).getTime();
          const end1 = new Date(f1.scheduledDeparture).getTime();
          const start2 = new Date(f2.scheduledArrival).getTime();
          const end2 = new Date(f2.scheduledDeparture).getTime();

          // Comprobar solapamiento: (StartA < EndB) y (StartB < EndA)
          if (start1 < end2 && start2 < end1) {
            const overlapStart = new Date(Math.max(start1, start2)).toISOString();
            const overlapEnd = new Date(Math.min(end1, end2)).toISOString();

            const desc = `Conflicto en ${standId}: Vuelo ${f1.inboundFlight} (${f1.scheduledArrival.slice(11, 16)}-${f1.scheduledDeparture.slice(11, 16)}) se solapa con ${f2.inboundFlight} (${f2.scheduledArrival.slice(11, 16)}-${f2.scheduledDeparture.slice(11, 16)})`;

            conflicts.push({
              standId,
              conflictingFlightIds: [f1.id, f2.id],
              overlapStart,
              overlapEnd,
              description: desc
            });

            // Registrar en el mapa individual de cada vuelo
            const c1 = flightConflictMap.get(f1.id) || [];
            c1.push(`Solapamiento con ${f2.inboundFlight} en ${standId}`);
            flightConflictMap.set(f1.id, c1);

            const c2 = flightConflictMap.get(f2.id) || [];
            c2.push(`Solapamiento con ${f1.inboundFlight} en ${standId}`);
            flightConflictMap.set(f2.id, c2);
          }
        }
      }
    }

    // Mapear vuelos con su estado de conflicto enriquecido
    const evaluatedFlights = flights.map(flight => {
      const issues = flightConflictMap.get(flight.id);
      if (issues && issues.length > 0) {
        return {
          ...flight,
          hasConflict: true,
          status: 'CONFLICT' as const,
          conflictDetails: issues
        };
      }
      return {
        ...flight,
        hasConflict: false,
        status: flight.status === 'CONFLICT' ? 'SCHEDULED' : flight.status,
        conflictDetails: []
      };
    });

    return { evaluatedFlights, conflicts };
  }
}
