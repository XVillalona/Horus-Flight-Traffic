import * as fs from 'fs';
import * as path from 'path';
import { DatabaseState, Stand, FlightAllocation } from './schema';
import { INITIAL_STANDS, getInitialFlights } from './initialData';

export class StandDatabase {
  private dbPath: string;
  private state: DatabaseState;

  constructor(customPath?: string) {
    this.dbPath = customPath || path.resolve(__dirname, '../../data/horus_database.json');
    this.state = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseState {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const parsed: DatabaseState = JSON.parse(raw);
        // Ensure stands exist if corrupted
        if (!parsed.stands || parsed.stands.length === 0) {
          parsed.stands = INITIAL_STANDS;
        }
        return parsed;
      } catch (err) {
        console.warn('[DB] Error leyendo base de datos existente, reinicializando con datos por defecto.', err);
      }
    }

    const initial: DatabaseState = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      stands: INITIAL_STANDS,
      flights: getInitialFlights()
    };

    this.saveToFile(initial);
    return initial;
  }

  private saveToFile(stateToSave?: DatabaseState): void {
    const toSave = stateToSave || this.state;
    toSave.lastUpdated = new Date().toISOString();
    const tempPath = `${this.dbPath}.tmp`;
    
    // Escritura atómica para prevenir corrupción de archivos en caso de corte imprevisto
    fs.writeFileSync(tempPath, JSON.stringify(toSave, null, 2), 'utf-8');
    fs.renameSync(tempPath, this.dbPath);
  }

  // --- MÉTODOS DE STANDS ---
  public getStands(): Stand[] {
    return [...this.state.stands].sort((a, b) => a.order - b.order);
  }

  public getStandById(id: string): Stand | undefined {
    return this.state.stands.find(s => s.id === id);
  }

  // --- MÉTODOS DE VUELOS ---
  public getFlights(): FlightAllocation[] {
    return [...this.state.flights];
  }

  public getFlightById(id: string): FlightAllocation | undefined {
    return this.state.flights.find(f => f.id === id);
  }

  public saveFlight(flight: FlightAllocation): FlightAllocation {
    const index = this.state.flights.findIndex(f => f.id === flight.id);
    const nowIso = new Date().toISOString();
    
    if (index >= 0) {
      this.state.flights[index] = {
        ...this.state.flights[index],
        ...flight,
        updatedAt: nowIso
      };
      this.saveToFile();
      return this.state.flights[index];
    } else {
      const newFlight: FlightAllocation = {
        ...flight,
        createdAt: flight.createdAt || nowIso,
        updatedAt: nowIso
      };
      this.state.flights.push(newFlight);
      this.saveToFile();
      return newFlight;
    }
  }

  public deleteFlight(id: string): boolean {
    const initialCount = this.state.flights.length;
    this.state.flights = this.state.flights.filter(f => f.id !== id);
    if (this.state.flights.length !== initialCount) {
      this.saveToFile();
      return true;
    }
    return false;
  }

  public bulkReplaceFlights(newFlights: FlightAllocation[]): void {
    this.state.flights = newFlights;
    this.saveToFile();
  }

  public bulkUpsertFlights(incomingFlights: FlightAllocation[]): { added: number; updated: number } {
    let added = 0;
    let updated = 0;
    const nowIso = new Date().toISOString();

    for (const incoming of incomingFlights) {
      const existingIndex = this.state.flights.findIndex(
        f => (incoming.id && f.id === incoming.id) ||
             (f.inboundFlight === incoming.inboundFlight && 
              f.scheduledArrival.slice(0, 10) === incoming.scheduledArrival.slice(0, 10))
      );

      if (existingIndex >= 0) {
        this.state.flights[existingIndex] = {
          ...this.state.flights[existingIndex],
          ...incoming,
          updatedAt: nowIso
        };
        updated++;
      } else {
        this.state.flights.push({
          ...incoming,
          id: incoming.id || `FL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          createdAt: nowIso,
          updatedAt: nowIso
        });
        added++;
      }
    }

    this.saveToFile();
    return { added, updated };
  }

  public resetToDefault(): void {
    this.state = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      stands: INITIAL_STANDS,
      flights: getInitialFlights()
    };
    this.saveToFile();
  }
}

// Instancia singleton para el servidor
export const db = new StandDatabase();
