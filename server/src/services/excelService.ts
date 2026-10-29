import * as XLSX from 'xlsx';
import { FlightAllocation } from '../db/schema';
import { StandDatabase } from '../db/database';

export interface ParseResult {
  flights: FlightAllocation[];
  errors: string[];
  totalRows: number;
}

export class ExcelService {
  /**
   * Procesa un archivo Excel o CSV y lo mapea a la estructura FlightAllocation.
   */
  public static parseFile(buffer: Buffer, db: StandDatabase): ParseResult {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const flights: FlightAllocation[] = [];
    const errors: string[] = [];
    const validStandIds = new Set(db.getStands().map(s => s.id.toUpperCase()));
    validStandIds.add('UNASSIGNED');

    const todayStr = new Date().toISOString().slice(0, 10);

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // Considerando cabecera en fila 1

      // Normalizar nombres de columnas a minúsculas sin acentos ni espacios
      const normalizedRow: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        const cleanKey = key
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        normalizedRow[cleanKey] = row[key];
      }

      // 0. REQUERIMIENTO: Descartar vuelos de la Terminal A
      const rawTerminal = (
        normalizedRow['terminal'] ||
        normalizedRow['term'] ||
        ''
      ).toString().trim().toUpperCase();

      if (rawTerminal === 'A' || rawTerminal === 'TERMINAL A' || rawTerminal === 'TA') {
        // Descartar vuelos de Terminal A
        return;
      }

      // 1. Extraer Aerolínea e IATA
      let airlineCode = (
        normalizedRow['iatacode'] ||
        normalizedRow['airline'] ||
        normalizedRow['airlinecode'] ||
        normalizedRow['aerolinea'] ||
        normalizedRow['cia'] ||
        ''
      ).toString().trim().toUpperCase();

      const rawAirlineName = (normalizedRow['aerolinea'] || normalizedRow['airline'] || '').toString().trim();

      // 2. Extraer y separar Número de Vuelo (Llegando / Saliendo con '/')
      const rawVuelo = (
        normalizedRow['vuelo'] ||
        normalizedRow['flight'] ||
        normalizedRow['inbound'] ||
        normalizedRow['inboundflight'] ||
        normalizedRow['vuelollegada'] ||
        normalizedRow['numero'] ||
        ''
      ).toString().trim().toUpperCase();

      if (!rawVuelo) {
        errors.push(`Fila ${rowNum}: Número de vuelo no encontrado.`);
        return;
      }

      let inbound = '';
      let outbound = (
        normalizedRow['outbound'] ||
        normalizedRow['outboundflight'] ||
        normalizedRow['vuelosalida'] ||
        normalizedRow['salidavuelo'] ||
        ''
      ).toString().trim().toUpperCase() || undefined;

      if (rawVuelo.includes('/')) {
        const parts = rawVuelo.split('/');
        inbound = parts[0].trim();
        if (!outbound && parts.length > 1) {
          outbound = parts[1].trim();
        }
      } else {
        inbound = rawVuelo;
      }

      if (!airlineCode && inbound.length >= 2) {
        airlineCode = inbound.slice(0, 2);
      }
      if (!airlineCode) airlineCode = 'XX';

      // Prefijar código IATA si el número de vuelo solo tiene dígitos
      if (/^\d+$/.test(inbound) && airlineCode && airlineCode !== 'XX') {
        inbound = `${airlineCode}${inbound}`;
      }
      if (outbound && /^\d+$/.test(outbound) && airlineCode && airlineCode !== 'XX') {
        outbound = `${airlineCode}${outbound}`;
      }

      // 3. Stand / Posición con normalización y variantes
      let stand = (
        normalizedRow['stand'] ||
        normalizedRow['standid'] ||
        normalizedRow['posicion'] ||
        normalizedRow['puerta'] ||
        normalizedRow['gate'] ||
        'UNASSIGNED'
      ).toString().trim().toUpperCase();

      if (stand.includes(',')) stand = stand.split(',')[0].trim();
      stand = stand.replace(/^STAND\s*/, '');

      // Mapeo de variantes conocidas en Punta Cana
      if (stand === 'B26A') stand = 'B26';
      else if (stand === 'B29A') stand = 'B29';
      else if (stand === 'B30A') stand = 'B30';
      else if (stand === 'B23') stand = 'B23A';
      else if (stand === 'P1A') stand = 'P1';
      else if (stand === 'P8A') stand = 'P8';
      else if (stand === 'P9A') stand = 'P9';
      else if (stand === 'P11A') stand = 'P11';
      else if (stand === 'C2') stand = 'P2';

      if (!validStandIds.has(stand)) {
        stand = 'UNASSIGNED';
      }

      // 4. Horas de llegada y salida con soporte multidía
      const rawSta = normalizedRow['sta'] || normalizedRow['llegada'] || normalizedRow['arrival'] || normalizedRow['horallegada'];
      const rawStd = normalizedRow['std'] || normalizedRow['salida'] || normalizedRow['departure'] || normalizedRow['horasalida'];

      const rawDia = (
        normalizedRow['dia'] ||
        normalizedRow['fecha'] ||
        normalizedRow['date'] ||
        normalizedRow['dianom'] ||
        ''
      ).toString().trim();

      let rowDateStr = todayStr;
      const dayMatch = rawDia.match(/(\d{1,2})/);
      if (dayMatch) {
        const dayNum = parseInt(dayMatch[1], 10);
        const month = dayNum >= 20 ? '10' : '11';
        rowDateStr = `2026-${month}-${String(dayNum).padStart(2, '0')}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDia)) {
        rowDateStr = rawDia;
      }

      const staIso = this.parseDate(rawSta, rowDateStr, 10, 0);
      const stdIso = this.parseDate(rawStd, rowDateStr, 11, 15);

      // 5. Modelo de Avión: REGLA ESTRICTA PARA ARAJET = 737MAX
      let aircraftType = (
        normalizedRow['aircraft'] ||
        normalizedRow['aircrafttype'] ||
        normalizedRow['avion'] ||
        normalizedRow['tipo'] ||
        normalizedRow['modelo'] ||
        ''
      ).toString().trim().toUpperCase();

      const isArajet = airlineCode === 'DM' || airlineCode === 'DWI' || rawAirlineName.toUpperCase().includes('ARAJET') || inbound.startsWith('DM');

      if (isArajet) {
        aircraftType = '737MAX'; // Requerimiento explícito: Vuelos de Arajet son 737MAX
      } else if (!aircraftType || aircraftType === 'A320') {
        // Flota predeterminada por aerolínea
        if (airlineCode === 'CM') aircraftType = 'B737-800';
        else if (airlineCode === 'WN') aircraftType = 'B737-800';
        else if (airlineCode === 'AA') aircraftType = 'B737-800';
        else if (airlineCode === 'DL') aircraftType = 'B757-200';
        else if (airlineCode === 'UA') aircraftType = 'B737-900';
        else if (airlineCode === 'B6') aircraftType = 'A321';
        else if (airlineCode === 'AC') aircraftType = 'B787-9';
        else if (airlineCode === 'TS') aircraftType = 'A321LR';
        else if (airlineCode === '5R') aircraftType = 'B737-300';
        else if (airlineCode === 'F9') aircraftType = 'A321neo';
        else if (airlineCode === 'AV') aircraftType = 'A320neo';
        else if (airlineCode === 'G3') aircraftType = 'B737MAX';
        else if (airlineCode === 'UX') aircraftType = 'B787-9';
        else if (airlineCode === 'AF') aircraftType = 'B777-300';
        else if (airlineCode === 'BA') aircraftType = 'B777-200';
        else aircraftType = 'A320';
      }

      const registration = (
        normalizedRow['registration'] ||
        normalizedRow['reg'] ||
        normalizedRow['matricula'] ||
        normalizedRow['tail'] ||
        ''
      ).toString().trim().toUpperCase() || undefined;

      const origin = (
        normalizedRow['origin'] ||
        normalizedRow['origen'] ||
        normalizedRow['from'] ||
        ''
      ).toString().trim().toUpperCase() || undefined;

      const destination = (
        normalizedRow['destination'] ||
        normalizedRow['destino'] ||
        normalizedRow['to'] ||
        ''
      ).toString().trim().toUpperCase() || undefined;

      const route = (normalizedRow['ruta'] || normalizedRow['route'] || '').toString().trim().toUpperCase() || undefined;
      const paxIn = Number(normalizedRow['paxin']) || undefined;
      const paxOut = Number(normalizedRow['paxout']) || undefined;
      const logoUrl = (normalizedRow['imageurl'] || normalizedRow['logo'] || '').toString().trim() || undefined;

      const notes = (normalizedRow['notes'] || normalizedRow['notas'] || normalizedRow['observaciones'] || '').toString().trim() || undefined;

      const nowIso = new Date().toISOString();

      flights.push({
        id: `IMP-${Date.now()}-${index + 1}`,
        inboundFlight: inbound,
        outboundFlight: outbound,
        airlineCode,
        airlineName: rawAirlineName || this.guessAirlineName(airlineCode),
        aircraftType,
        registration,
        origin,
        destination,
        route,
        paxIn,
        paxOut,
        logoUrl,
        standId: stand,
        scheduledArrival: staIso,
        scheduledDeparture: stdIso,
        status: 'SCHEDULED',
        notes,
        createdAt: nowIso,
        updatedAt: nowIso
      });
    });

    return {
      flights,
      errors,
      totalRows: rawRows.length
    };
  }

  /**
   * Genera una plantilla Excel de ejemplo con las columnas y formatos correctos.
   */
  public static generateTemplate(): Buffer {
    const today = new Date().toISOString().slice(0, 10);
    const sampleData = [
      {
        'Vuelo Llegada': 'IB3111',
        'Vuelo Salida': 'IB3110',
        'Stand': 'B20',
        'Hora Llegada (STA)': `${today} 10:15`,
        'Hora Salida (STD)': `${today} 11:30`,
        'Aerolinea': 'IB',
        'Tipo Avion': 'A320',
        'Matricula': 'EC-MOU',
        'Origen': 'MAD',
        'Destino': 'BCN',
        'Notas': 'Turnaround regular'
      },
      {
        'Vuelo Llegada': 'AA103',
        'Vuelo Salida': 'AA102',
        'Stand': 'B21',
        'Hora Llegada (STA)': `${today} 10:45`,
        'Hora Salida (STD)': `${today} 12:45`,
        'Aerolinea': 'AA',
        'Tipo Avion': 'B787-8',
        'Matricula': 'N800AA',
        'Origen': 'MIA',
        'Destino': 'MIA',
        'Notas': 'Widebody internacional'
      },
      {
        'Vuelo Llegada': 'SN3128',
        'Vuelo Salida': 'SN3129',
        'Stand': 'B23A',
        'Hora Llegada (STA)': `${today} 11:00`,
        'Hora Salida (STD)': `${today} 12:15`,
        'Aerolinea': 'SN',
        'Tipo Avion': 'A319',
        'Matricula': 'OO-SSA',
        'Origen': 'BRU',
        'Destino': 'BRU',
        'Notas': 'Posicion dividida 23A'
      },
      {
        'Vuelo Llegada': 'IB3321',
        'Vuelo Salida': 'IB3320',
        'Stand': 'B23B',
        'Hora Llegada (STA)': `${today} 11:15`,
        'Hora Salida (STD)': `${today} 12:30`,
        'Aerolinea': 'IB',
        'Tipo Avion': 'A320',
        'Matricula': 'EC-MYC',
        'Origen': 'PMI',
        'Destino': 'PMI',
        'Notas': 'Posicion dividida 23B'
      },
      {
        'Vuelo Llegada': 'UX4011',
        'Vuelo Salida': 'UX4012',
        'Stand': 'N6',
        'Hora Llegada (STA)': `${today} 12:00`,
        'Hora Salida (STD)': `${today} 13:15`,
        'Aerolinea': 'UX',
        'Tipo Avion': 'B738',
        'Matricula': 'EC-MPS',
        'Origen': 'ORY',
        'Destino': 'ORY',
        'Notas': 'Rampa N'
      },
      {
        'Vuelo Llegada': 'BA460',
        'Vuelo Salida': 'BA461',
        'Stand': 'UNASSIGNED',
        'Hora Llegada (STA)': `${today} 13:00`,
        'Hora Salida (STD)': `${today} 14:15`,
        'Aerolinea': 'BA',
        'Tipo Avion': 'A320',
        'Matricula': 'G-EUYL',
        'Origen': 'LHR',
        'Destino': 'LHR',
        'Notas': 'Sin asignar temporalmente'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    // Ajustar anchos de columnas
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asignacion_Stands');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  private static parseDate(value: any, fallbackDate: string, defaultHour: number, defaultMin: number): string {
    if (!value) {
      return `${fallbackDate}T${String(defaultHour).padStart(2, '0')}:${String(defaultMin).padStart(2, '0')}:00.000Z`;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    const str = String(value).trim();

    // Si es formato solo hora (HH:mm o HH:mm:ss)
    const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const h = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
      const m = timeMatch[2];
      return `${fallbackDate}T${h}:${m}:00.000Z`;
    }

    // Si es formato fecha + hora (YYYY-MM-DD HH:mm o DD/MM/YYYY HH:mm)
    const dateParsed = new Date(str);
    if (!isNaN(dateParsed.getTime())) {
      return dateParsed.toISOString();
    }

    return `${fallbackDate}T${String(defaultHour).padStart(2, '0')}:${String(defaultMin).padStart(2, '0')}:00.000Z`;
  }

  private static guessAirlineName(code: string): string {
    const map: Record<string, string> = {
      DM: 'Arajet',
      DWI: 'Arajet',
      B6: 'Jetblue Airways',
      CM: 'Copa Airlines',
      WN: 'Southwest Airlines',
      AA: 'American Airlines',
      UA: 'United Airlines',
      DL: 'Delta Air Lines',
      AC: 'Air Canada',
      TS: 'Air Transat',
      '5R': 'Rutaca Airlines',
      F9: 'Frontier Airlines',
      AV: 'Avianca-Taca',
      G3: 'Gol Transportes Aereos',
      IB: 'Iberia',
      AY: 'Finnair',
      SN: 'Brussels Airlines',
      UX: 'Air Europa',
      BA: 'British Airways',
      AF: 'Air France',
      LH: 'Lufthansa',
      KL: 'KLM',
      VY: 'Vueling'
    };
    return map[code] || `Aerolínea ${code}`;
  }
}
