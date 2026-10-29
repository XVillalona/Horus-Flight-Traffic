import { FlightAllocation } from '../db/schema';
import { StandDatabase } from '../db/database';
import { ConflictDetector } from './conflictDetector';

export interface RedashSyncConfig {
  baseUrl: string;
  dashboardId: number;
  queryId: number;
  apiKey: string;
  email: string;
  password?: string;
  terminalFilter: string;
  autoSyncIntervalMinutes: number;
}

export interface RedashSyncStatus {
  isSyncing: boolean;
  lastSyncTimestamp?: string;
  lastSyncStatus: 'SUCCESS' | 'ERROR' | 'IDLE';
  flightsIngested: number;
  terminalBTotal: number;
  totalDatasetRows: number;
  errorMessage?: string;
  autoSyncEnabled: boolean;
  intervalMinutes: number;
}

export class RedashService {
  private static instance: RedashService;
  private db: StandDatabase;

  private config: RedashSyncConfig = {
    baseUrl: process.env.REDASH_BASE_URL || 'https://dashboard.puntacanainternationalairport.com',
    dashboardId: parseInt(process.env.REDASH_DASHBOARD_ID || '4', 10),
    queryId: parseInt(process.env.REDASH_QUERY_ID || '27', 10),
    apiKey: process.env.REDASH_API_KEY || '',
    email: process.env.REDASH_EMAIL || '',
    password: process.env.REDASH_PASSWORD || '',
    terminalFilter: process.env.REDASH_TERMINAL_FILTER || 'B',
    autoSyncIntervalMinutes: parseInt(process.env.REDASH_AUTO_SYNC_INTERVAL || '5', 10)
  };

  private status: RedashSyncStatus = {
    isSyncing: false,
    lastSyncStatus: 'IDLE',
    flightsIngested: 0,
    terminalBTotal: 0,
    totalDatasetRows: 0,
    autoSyncEnabled: true,
    intervalMinutes: 5
  };

  private timer: NodeJS.Timeout | null = null;
  private sessionCookies: string = '';

  private constructor(db: StandDatabase) {
    this.db = db;
  }

  public static getInstance(db: StandDatabase): RedashService {
    if (!RedashService.instance) {
      RedashService.instance = new RedashService(db);
    }
    return RedashService.instance;
  }

  public getStatus(): RedashSyncStatus {
    return { ...this.status };
  }

  public getConfig(): Omit<RedashSyncConfig, 'password'> {
    const { password, ...safe } = this.config;
    return safe;
  }

  public updateConfig(newConfig: Partial<RedashSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.autoSyncIntervalMinutes !== undefined) {
      this.status.intervalMinutes = newConfig.autoSyncIntervalMinutes;
      this.startAutoSync();
    }
  }

  /**
   * Ejecuta sincronización inmediata contra Redash PUJ
   */
  public async syncNow(mode: 'replace' | 'upsert' = 'replace'): Promise<{
    success: boolean;
    flights: FlightAllocation[];
    totalDatasetRows: number;
    terminalBCount: number;
    discardedCount: number;
    conflictsCount: number;
    standChanges: Array<{
      flightId: string;
      inboundFlight: string;
      airlineName: string;
      airlineCode: string;
      previousStand: string;
      newStand: string;
      scheduledArrival: string;
      scheduledDeparture: string;
      flightDate: string;
    }>;
    message: string;
  }> {
    if (this.status.isSyncing) {
      throw new Error('Ya hay una sincronización en curso con el dashboard de Redash.');
    }

    this.status.isSyncing = true;
    try {
      console.log(`[RedashService] Iniciando sincronización con PUJ (Query ${this.config.queryId})...`);
      
      let rows: any[] = [];
      try {
        rows = await this.fetchViaApiKey();
      } catch (err: any) {
        console.warn(`[RedashService] Consulta directa con API Key falló (${err.message}). Intentando autenticación por sesión...`);
        rows = await this.fetchViaSessionLogin();
      }

      const totalDatasetRows = rows.length;
      console.log(`[RedashService] Obtenidas ${totalDatasetRows} filas totales del reporte oficial.`);

      // 1. Filtrar estrictamente por Terminal B
      const terminalBRows = rows.filter(row => {
        const term = String(row.TERMINAL || row.terminal || '').trim().toUpperCase();
        return term === 'B' || term === 'TERMINAL B';
      });

      const terminalBCount = terminalBRows.length;
      const discardedCount = totalDatasetRows - terminalBCount;
      console.log(`[RedashService] Filtro Terminal B aplicado: ${terminalBCount} vuelos aceptados, ${discardedCount} descartados.`);

      // 2. Mapear filas a FlightAllocation
      const mappedFlights = this.mapRedashRowsToFlights(terminalBRows);

      // 2.1 Detectar cambios de posición respecto a la base de datos previa
      const previousFlights = this.db.getFlights();
      const standChanges: Array<{
        flightId: string;
        inboundFlight: string;
        airlineName: string;
        airlineCode: string;
        previousStand: string;
        newStand: string;
        scheduledArrival: string;
        scheduledDeparture: string;
        flightDate: string;
      }> = [];

      if (previousFlights.length > 0) {
        for (const incoming of mappedFlights) {
          const prev = previousFlights.find(p => 
            p.inboundFlight === incoming.inboundFlight &&
            p.scheduledArrival.slice(0, 10) === incoming.scheduledArrival.slice(0, 10)
          );
          if (prev && prev.standId !== incoming.standId) {
            standChanges.push({
              flightId: incoming.id,
              inboundFlight: incoming.inboundFlight,
              airlineName: incoming.airlineName,
              airlineCode: incoming.airlineCode,
              previousStand: prev.standId,
              newStand: incoming.standId,
              scheduledArrival: incoming.scheduledArrival,
              scheduledDeparture: incoming.scheduledDeparture,
              flightDate: incoming.scheduledArrival.slice(0, 10)
            });
          }
        }
      }

      if (standChanges.length > 0) {
        console.log(`[RedashService] 🔔 SE DETECTARON ${standChanges.length} CAMBIOS DE POSICIÓN EN TERMINAL B:`);
        standChanges.forEach(sc => {
          console.log(`  - ${sc.inboundFlight} (${sc.airlineName}): ${sc.previousStand} ➔ ${sc.newStand}`);
        });
      }

      // 3. Persistir en la base de datos
      if (mode === 'replace') {
        this.db.bulkReplaceFlights(mappedFlights);
      } else {
        this.db.bulkUpsertFlights(mappedFlights);
      }

      // 4. Evaluar conflictos
      const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts(this.db.getFlights());

      // 5. Actualizar estado
      this.status.isSyncing = false;
      this.status.lastSyncStatus = 'SUCCESS';
      this.status.lastSyncTimestamp = new Date().toISOString();
      this.status.flightsIngested = mappedFlights.length;
      this.status.terminalBTotal = terminalBCount;
      this.status.totalDatasetRows = totalDatasetRows;
      delete this.status.errorMessage;

      const message = `Sincronización exitosa con Dashboard PUJ. ${mappedFlights.length} vuelos de Terminal B procesados (${conflicts.length} conflictos detectados, ${standChanges.length} cambios de posición).`;
      console.log(`[RedashService] ${message}`);

      return {
        success: true,
        flights: evaluatedFlights,
        totalDatasetRows,
        terminalBCount,
        discardedCount,
        conflictsCount: conflicts.length,
        standChanges,
        message
      };
    } catch (err: any) {
      this.status.isSyncing = false;
      this.status.lastSyncStatus = 'ERROR';
      this.status.errorMessage = err.message;
      console.error(`[RedashService] Error en sincronización:`, err);
      throw err;
    }
  }

  /**
   * Intenta obtener los resultados usando el Query API Key
   */
  private async fetchViaApiKey(): Promise<any[]> {
    const url = `${this.config.baseUrl}/api/queries/${this.config.queryId}/results.json?api_key=${this.config.apiKey}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Horus-Stand-Allocation/2.0 (Terminal B Live Sync)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: any = await response.json();
    const rows = data?.query_result?.data?.rows;
    if (!Array.isArray(rows)) {
      throw new Error('La respuesta de Redash no contiene el array data.rows esperado.');
    }

    return rows;
  }

  /**
   * Inicia sesión en Redash con email y contraseña si la API key expirase o rotase
   */
  private async fetchViaSessionLogin(): Promise<any[]> {
    if (!this.config.password) {
      throw new Error('No se ha configurado contraseña para inicio de sesión en Redash.');
    }

    const loginUrl = `${this.config.baseUrl}/login`;
    
    // Paso A: Obtener página de login para CSRF token y cookies iniciales
    const getLoginResp = await fetch(loginUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const html = await getLoginResp.text();
    const rawSetCookie = getLoginResp.headers.get('set-cookie') || '';

    const csrfMatch = html.match(/name="csrf_token"\s+value="([^"]+)"/);
    if (!csrfMatch) {
      throw new Error('No se pudo encontrar el token CSRF en la página de login de Redash.');
    }
    const csrfToken = csrfMatch[1];

    // Paso B: Enviar POST login
    const params = new URLSearchParams();
    params.append('csrf_token', csrfToken);
    params.append('email', this.config.email);
    params.append('password', this.config.password);
    params.append('remember', 'on');

    const postResp = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': rawSetCookie,
        'User-Agent': 'Mozilla/5.0'
      },
      body: params.toString(),
      redirect: 'manual'
    });

    const loginSetCookie = postResp.headers.get('set-cookie') || rawSetCookie;
    this.sessionCookies = loginSetCookie;

    // Paso C: Obtener query results con la cookie de sesión
    const queryResultsUrl = `${this.config.baseUrl}/api/queries/${this.config.queryId}/results`;
    const resultsResp = await fetch(queryResultsUrl, {
      headers: {
        'Cookie': this.sessionCookies,
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!resultsResp.ok) {
      throw new Error(`Fallo al consultar /api/queries/${this.config.queryId}/results tras login (HTTP ${resultsResp.status})`);
    }

    const data: any = await resultsResp.json();
    const rows = data?.query_result?.data?.rows;
    if (!Array.isArray(rows)) {
      throw new Error('Respuesta inválida en sesión autenticada de Redash.');
    }

    return rows;
  }

  /**
   * Mapea el dataset de Redash Query 27 a la estructura FlightAllocation de Horus
   */
  private mapRedashRowsToFlights(rows: any[]): FlightAllocation[] {
    const validStandIds = new Set(this.db.getStands().map(s => s.id.toUpperCase()));
    validStandIds.add('UNASSIGNED');

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const nowIso = today.toISOString();

    return rows.map((row, index) => {
      // 1. Aerolínea y código IATA
      let iata = String(row.iatacode || '').trim().toUpperCase();
      const rawAirlineName = String(row.AEROLINEA || '').trim();

      // 2. Número de vuelo con separador '/'
      const rawVuelo = String(row.Vuelo || '').trim().toUpperCase();
      let inbound = '';
      let outbound: string | undefined = undefined;

      if (rawVuelo.includes('/')) {
        const parts = rawVuelo.split('/');
        inbound = parts[0].trim();
        if (parts.length > 1) outbound = parts[1].trim();
      } else {
        inbound = rawVuelo;
      }

      if (!iata && inbound.length >= 2) {
        iata = inbound.slice(0, 2);
      }
      if (!iata) iata = 'XX';

      // Prefijar código IATA si el vuelo solo tiene dígitos
      if (/^\d+$/.test(inbound) && iata !== 'XX') {
        inbound = `${iata}${inbound}`;
      }
      if (outbound && /^\d+$/.test(outbound) && iata !== 'XX') {
        outbound = `${iata}${outbound}`;
      }

      // 3. Normalización de Stand
      let stand = String(row.STAND || row.GATE || 'UNASSIGNED').trim().toUpperCase();
      if (stand.includes(',')) stand = stand.split(',')[0].trim();
      stand = stand.replace(/^STAND\s*/, '');

      // Normalizar variantes conocidas en PUJ
      if (stand === 'B26A') stand = 'B26';
      else if (stand === 'B29A') stand = 'B29';
      else if (stand === 'B30A') stand = 'B30';
      else if (stand === 'B23') stand = 'B23A';
      else if (stand === '.' || !stand || !validStandIds.has(stand)) {
        stand = 'UNASSIGNED';
      }

      // 4. Fechas y Horas (STA / STD)
      const rawDia = String(row.DIA || row.dianom || '').trim();
      let rowDateStr = todayStr;
      const dayMatch = rawDia.match(/(\d{1,2})/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1], 10);
        // Si el número de día es >= 20 y estamos a finales de mes o principio
        const month = dayNum >= 20 ? '10' : '11';
        rowDateStr = `2026-${month}-${String(dayNum).padStart(2, '0')}`;
      }

      const rawSta = String(row.STA || '10:00').trim();
      const rawStd = String(row.STD || '11:30').trim();

      const staIso = this.formatIsoTime(rawSta, rowDateStr, 10, 0);

      // Tratamiento especial de vuelos nocturnos 'OVER' (Overnight)
      let stdIso: string;
      let notes = `Terminal B | Ruta: ${row.RUTA || 'PUJ'}`;
      if (rawStd.toUpperCase() === 'OVER') {
        stdIso = `${rowDateStr}T23:59:00.000Z`;
        notes = `OVERNIGHT (Pernocta en rampa) | Ruta: ${row.RUTA || 'PUJ'}`;
      } else {
        stdIso = this.formatIsoTime(rawStd, rowDateStr, 11, 30);
      }

      // 5. Modelo de Aeronave (REGLA ARAJET = 737MAX ESTRICTO)
      const isArajet = iata === 'DM' || iata === 'DWI' || rawAirlineName.toUpperCase().includes('ARAJET') || inbound.startsWith('DM');
      let aircraftType = 'A320';
      if (isArajet) {
        aircraftType = '737MAX';
      } else if (iata === 'CM' || iata === 'WN' || iata === 'AA') {
        aircraftType = 'B737-800';
      } else if (iata === 'UA') {
        aircraftType = 'B737-900';
      } else if (iata === 'DL') {
        aircraftType = 'B757-200';
      } else if (iata === 'B6') {
        aircraftType = 'A321';
      } else if (iata === 'BA') {
        aircraftType = 'B777-200';
      } else if (iata === 'UX' || iata === 'AF') {
        aircraftType = 'B787-9';
      }

      // 6. Pasajeros y metadatos
      const paxIn = Number(row.paxin) || undefined;
      const paxOut = Number(row.paxout) || undefined;
      const logoUrl = String(row.image_url || '').trim() || undefined;

      return {
        id: `RD-${rowDateStr.replace(/-/g, '')}-${inbound}-${index + 1}`,
        inboundFlight: inbound,
        outboundFlight: outbound,
        airlineCode: iata,
        airlineName: rawAirlineName || (isArajet ? 'Arajet' : `Aerolínea ${iata}`),
        aircraftType,
        standId: stand,
        scheduledArrival: staIso,
        scheduledDeparture: stdIso,
        status: 'SCHEDULED',
        route: row.RUTA || undefined,
        paxIn,
        paxOut,
        logoUrl,
        notes,
        createdAt: nowIso,
        updatedAt: nowIso
      };
    });
  }

  private formatIsoTime(timeStr: string, dateStr: string, fallbackH: number, fallbackM: number): string {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = String(parseInt(match[1], 10)).padStart(2, '0');
      const m = match[2];
      return `${dateStr}T${h}:${m}:00.000Z`;
    }
    return `${dateStr}T${String(fallbackH).padStart(2, '0')}:${String(fallbackM).padStart(2, '0')}:00.000Z`;
  }

  /**
   * Inicia el proceso de auto-polling en segundo plano
   */
  public startAutoSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this.config.autoSyncIntervalMinutes <= 0) {
      this.status.autoSyncEnabled = false;
      console.log(`[RedashService] Auto-sincronización desactivada (intervalo = 0).`);
      return;
    }

    this.status.autoSyncEnabled = true;
    const intervalMs = this.config.autoSyncIntervalMinutes * 60 * 1000;
    console.log(`[RedashService] Auto-sincronización programada cada ${this.config.autoSyncIntervalMinutes} minutos.`);

    this.timer = setInterval(() => {
      console.log(`[RedashService] Ejecutando sincronización programada en background...`);
      this.syncNow('replace').catch(err => {
        console.error(`[RedashService] Error en sync programado:`, err.message);
      });
    }, intervalMs);
  }

  public stopAutoSync(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.status.autoSyncEnabled = false;
  }
}
