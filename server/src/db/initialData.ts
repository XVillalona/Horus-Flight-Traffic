import { Stand, FlightAllocation } from './schema';

export const INITIAL_STANDS: Stand[] = [
  // 1. Fila superior Unassigned (Standby / Sin Asignar)
  {
    id: 'UNASSIGNED',
    name: 'Unassigned',
    category: 'UNASSIGNED',
    order: 0,
    maxAircraftSize: 'All',
    terminal: 'Rampa',
    description: 'Vuelos pendientes de asignación de puerta/posición'
  },

  // 2. Bloque B: B20 a B37 (Con división explícita B23A y B23B)
  { id: 'B20', name: 'Stand B20', category: 'B-GATES', order: 1, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B21', name: 'Stand B21', category: 'B-GATES', order: 2, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B22', name: 'Stand B22', category: 'B-GATES', order: 3, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B23A', name: 'Stand B23A', category: 'B-GATES', order: 4, maxAircraftSize: 'Regional / Narrowbody (A319/E190)', terminal: 'Terminal B', description: 'Posición dividida 23A' },
  { id: 'B23B', name: 'Stand B23B', category: 'B-GATES', order: 5, maxAircraftSize: 'Regional / Narrowbody (A319/E190)', terminal: 'Terminal B', description: 'Posición dividida 23B' },
  { id: 'B24', name: 'Stand B24', category: 'B-GATES', order: 6, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B25', name: 'Stand B25', category: 'B-GATES', order: 7, maxAircraftSize: 'Widebody (A330/B787)', terminal: 'Terminal B' },
  { id: 'B26', name: 'Stand B26', category: 'B-GATES', order: 8, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B27', name: 'Stand B27', category: 'B-GATES', order: 9, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B28', name: 'Stand B28', category: 'B-GATES', order: 10, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B29', name: 'Stand B29', category: 'B-GATES', order: 11, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B30', name: 'Stand B30', category: 'B-GATES', order: 12, maxAircraftSize: 'Widebody (A350/B777)', terminal: 'Terminal B' },
  { id: 'B31', name: 'Stand B31', category: 'B-GATES', order: 13, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B32', name: 'Stand B32', category: 'B-GATES', order: 14, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B33', name: 'Stand B33', category: 'B-GATES', order: 15, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B34', name: 'Stand B34', category: 'B-GATES', order: 16, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B35', name: 'Stand B35', category: 'B-GATES', order: 17, maxAircraftSize: 'Widebody (A350/B777)', terminal: 'Terminal B' },
  { id: 'B36', name: 'Stand B36', category: 'B-GATES', order: 18, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },
  { id: 'B37', name: 'Stand B37', category: 'B-GATES', order: 19, maxAircraftSize: 'Narrowbody (A320/B737)', terminal: 'Terminal B' },

  // 3. Bloque N: N1, N6 a N13
  { id: 'N1', name: 'Stand N1', category: 'N-GATES', order: 20, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N6', name: 'Stand N6', category: 'N-GATES', order: 21, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N7', name: 'Stand N7', category: 'N-GATES', order: 22, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N8', name: 'Stand N8', category: 'N-GATES', order: 23, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N9', name: 'Stand N9', category: 'N-GATES', order: 24, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N10', name: 'Stand N10', category: 'N-GATES', order: 25, maxAircraftSize: 'Widebody (A330/B787)', terminal: 'Terminal N' },
  { id: 'N11', name: 'Stand N11', category: 'N-GATES', order: 26, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N12', name: 'Stand N12', category: 'N-GATES', order: 27, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },
  { id: 'N13', name: 'Stand N13', category: 'N-GATES', order: 28, maxAircraftSize: 'Narrowbody (737MAX/A320)', terminal: 'Terminal N' },

  // 4. Bloque P: Plataforma Remotas P1 a P11 (Punta Cana)
  { id: 'P1', name: 'Stand P1', category: 'P-RAMP', order: 29, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P2', name: 'Stand P2', category: 'P-RAMP', order: 30, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P3', name: 'Stand P3', category: 'P-RAMP', order: 31, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P4', name: 'Stand P4', category: 'P-RAMP', order: 32, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P5', name: 'Stand P5', category: 'P-RAMP', order: 33, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P6', name: 'Stand P6', category: 'P-RAMP', order: 34, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P7', name: 'Stand P7', category: 'P-RAMP', order: 35, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P8', name: 'Stand P8', category: 'P-RAMP', order: 36, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P9', name: 'Stand P9', category: 'P-RAMP', order: 37, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
  { id: 'P10', name: 'Stand P10', category: 'P-RAMP', order: 38, maxAircraftSize: 'Remota / Widebody', terminal: 'Plataforma P' },
  { id: 'P11', name: 'Stand P11', category: 'P-RAMP', order: 39, maxAircraftSize: 'Remota / Narrowbody', terminal: 'Plataforma P' },
];

// Función para generar fecha base hoy en formato ISO
export function getTodayDateString(offsetHours: number = 0, offsetMinutes: number = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours);
  d.setMinutes(d.getMinutes() + offsetMinutes);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.toISOString();
}

// Generador de fecha fija relativa al día de hoy para inicializar la visualización
export function getTargetDateISO(hour: number, minute: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  return d.toISOString();
}

export function getInitialFlights(): FlightAllocation[] {
  const nowIso = new Date().toISOString();
  
  return [
    // Stand B20
    {
      id: 'FL-1001',
      inboundFlight: 'IB3106',
      outboundFlight: 'IB3107',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A320-200',
      registration: 'EC-MOU',
      origin: 'MAD',
      destination: 'CDG',
      standId: 'B20',
      scheduledArrival: getTargetDateISO(9, 30),
      scheduledDeparture: getTargetDateISO(10, 45),
      status: 'ON_BLOCK',
      notes: 'Turnaround estándar 75 min',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1002',
      inboundFlight: 'IB3114',
      outboundFlight: 'IB3115',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A321neo',
      registration: 'EC-NGD',
      origin: 'LHR',
      destination: 'MAD',
      standId: 'B20',
      scheduledArrival: getTargetDateISO(12, 15),
      scheduledDeparture: getTargetDateISO(13, 30),
      status: 'SCHEDULED',
      notes: 'Llegada en hora',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1003',
      inboundFlight: 'IB3118',
      outboundFlight: 'IB3119',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A320-200',
      registration: 'EC-LZX',
      origin: 'FCO',
      destination: 'MAD',
      standId: 'B20',
      scheduledArrival: getTargetDateISO(15, 0),
      scheduledDeparture: getTargetDateISO(16, 15),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B21
    {
      id: 'FL-1004',
      inboundFlight: 'AA103',
      outboundFlight: 'AA102',
      airlineCode: 'AA',
      airlineName: 'American Airlines',
      aircraftType: 'B787-8',
      registration: 'N800AA',
      origin: 'MIA',
      destination: 'MIA',
      standId: 'B21',
      scheduledArrival: getTargetDateISO(9, 45),
      scheduledDeparture: getTargetDateISO(11, 45),
      status: 'ON_BLOCK',
      notes: 'Widebody escala larga (2h)',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1005',
      inboundFlight: 'AY3203',
      outboundFlight: 'AY3202',
      airlineCode: 'AY',
      airlineName: 'Finnair',
      aircraftType: 'A321',
      registration: 'OH-LZK',
      origin: 'HEL',
      destination: 'HEL',
      standId: 'B21',
      scheduledArrival: getTargetDateISO(13, 30),
      scheduledDeparture: getTargetDateISO(14, 45),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B22
    {
      id: 'FL-1006',
      inboundFlight: 'AY3193',
      outboundFlight: 'AY3192',
      airlineCode: 'AY',
      airlineName: 'Finnair',
      aircraftType: 'A320',
      registration: 'OH-LXA',
      origin: 'HEL',
      destination: 'HEL',
      standId: 'B22',
      scheduledArrival: getTargetDateISO(10, 0),
      scheduledDeparture: getTargetDateISO(11, 15),
      status: 'ON_BLOCK',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1007',
      inboundFlight: 'AY3197',
      outboundFlight: 'AY3196',
      airlineCode: 'AY',
      airlineName: 'Finnair',
      aircraftType: 'A320',
      registration: 'OH-LXB',
      origin: 'HEL',
      destination: 'HEL',
      standId: 'B22',
      scheduledArrival: getTargetDateISO(12, 0),
      scheduledDeparture: getTargetDateISO(13, 10),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B23A (División de B23)
    {
      id: 'FL-1008',
      inboundFlight: 'SN3128',
      outboundFlight: 'SN3129',
      airlineCode: 'SN',
      airlineName: 'Brussels Airlines',
      aircraftType: 'A319',
      registration: 'OO-SSY',
      origin: 'BRU',
      destination: 'BRU',
      standId: 'B23A',
      scheduledArrival: getTargetDateISO(10, 15),
      scheduledDeparture: getTargetDateISO(11, 20),
      status: 'ON_BLOCK',
      notes: 'Asignado en B23A (regional/narrowbody)',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1009',
      inboundFlight: 'SN3134',
      outboundFlight: 'SN3135',
      airlineCode: 'SN',
      airlineName: 'Brussels Airlines',
      aircraftType: 'A319',
      registration: 'OO-SSZ',
      origin: 'BRU',
      destination: 'BRU',
      standId: 'B23A',
      scheduledArrival: getTargetDateISO(12, 30),
      scheduledDeparture: getTargetDateISO(13, 40),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B23B (División de B23)
    {
      id: 'FL-1010',
      inboundFlight: 'IB3321',
      outboundFlight: 'IB3320',
      airlineCode: 'IB',
      airlineName: 'Iberia Express',
      aircraftType: 'A320',
      registration: 'EC-MYC',
      origin: 'PMI',
      destination: 'PMI',
      standId: 'B23B',
      scheduledArrival: getTargetDateISO(10, 30),
      scheduledDeparture: getTargetDateISO(11, 40),
      status: 'ON_BLOCK',
      notes: 'Asignado en B23B (paralelo a 23A)',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1011',
      inboundFlight: 'IB3325',
      outboundFlight: 'IB3324',
      airlineCode: 'IB',
      airlineName: 'Iberia Express',
      aircraftType: 'A320',
      registration: 'EC-MEG',
      origin: 'TFS',
      destination: 'TFS',
      standId: 'B23B',
      scheduledArrival: getTargetDateISO(12, 10),
      scheduledDeparture: getTargetDateISO(13, 15),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B24
    {
      id: 'FL-1012',
      inboundFlight: 'IB3148',
      outboundFlight: 'IB3149',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A320',
      registration: 'EC-KDG',
      origin: 'LIS',
      destination: 'LIS',
      standId: 'B24',
      scheduledArrival: getTargetDateISO(10, 15),
      scheduledDeparture: getTargetDateISO(11, 35),
      status: 'ON_BLOCK',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1013',
      inboundFlight: 'IB3152',
      outboundFlight: 'IB3153',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A321',
      registration: 'EC-ILR',
      origin: 'BIO',
      destination: 'BIO',
      standId: 'B24',
      scheduledArrival: getTargetDateISO(12, 20),
      scheduledDeparture: getTargetDateISO(13, 35),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B25
    {
      id: 'FL-1014',
      inboundFlight: 'IB6286',
      outboundFlight: 'IB6287',
      airlineCode: 'IB',
      airlineName: 'Iberia Long Haul',
      aircraftType: 'A350-900',
      registration: 'EC-MYX',
      origin: 'EZE',
      destination: 'ORD',
      standId: 'B25',
      scheduledArrival: getTargetDateISO(10, 30),
      scheduledDeparture: getTargetDateISO(12, 0),
      status: 'ON_BLOCK',
      notes: 'Intercontinental A350',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1015',
      inboundFlight: 'IB6290',
      outboundFlight: 'IB6291',
      airlineCode: 'IB',
      airlineName: 'Iberia Long Haul',
      aircraftType: 'A330-200',
      registration: 'EC-MJA',
      origin: 'BOG',
      destination: 'BOG',
      standId: 'B25',
      scheduledArrival: getTargetDateISO(12, 45),
      scheduledDeparture: getTargetDateISO(14, 15),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stand B26 & B27
    {
      id: 'FL-1016',
      inboundFlight: 'SN3130',
      outboundFlight: 'SN3131',
      airlineCode: 'SN',
      airlineName: 'Brussels Airlines',
      aircraftType: 'A320',
      registration: 'OO-SNB',
      origin: 'BRU',
      destination: 'BRU',
      standId: 'B26',
      scheduledArrival: getTargetDateISO(10, 50),
      scheduledDeparture: getTargetDateISO(12, 5),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1017',
      inboundFlight: 'AA106',
      outboundFlight: 'AA107',
      airlineCode: 'AA',
      airlineName: 'American Airlines',
      aircraftType: 'B777-200ER',
      registration: 'N780AA',
      origin: 'DFW',
      destination: 'DFW',
      standId: 'B27',
      scheduledArrival: getTargetDateISO(12, 35),
      scheduledDeparture: getTargetDateISO(14, 0),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Stands N6 a N13
    {
      id: 'FL-1018',
      inboundFlight: 'UX4011',
      outboundFlight: 'UX4012',
      airlineCode: 'UX',
      airlineName: 'Air Europa',
      aircraftType: 'B737-800',
      registration: 'EC-MPS',
      origin: 'ORY',
      destination: 'ORY',
      standId: 'N6',
      scheduledArrival: getTargetDateISO(10, 10),
      scheduledDeparture: getTargetDateISO(11, 25),
      status: 'ON_BLOCK',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1019',
      inboundFlight: 'UX4015',
      outboundFlight: 'UX4016',
      airlineCode: 'UX',
      airlineName: 'Air Europa',
      aircraftType: 'B787-9',
      registration: 'EC-MSZ',
      origin: 'SDQ',
      destination: 'CUN',
      standId: 'N6',
      scheduledArrival: getTargetDateISO(12, 15),
      scheduledDeparture: getTargetDateISO(13, 50),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1020',
      inboundFlight: 'AF1400',
      outboundFlight: 'AF1401',
      airlineCode: 'AF',
      airlineName: 'Air France',
      aircraftType: 'A321',
      registration: 'F-GTAU',
      origin: 'CDG',
      destination: 'CDG',
      standId: 'N7',
      scheduledArrival: getTargetDateISO(11, 0),
      scheduledDeparture: getTargetDateISO(12, 10),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1021',
      inboundFlight: 'LH1112',
      outboundFlight: 'LH1113',
      airlineCode: 'LH',
      airlineName: 'Lufthansa',
      aircraftType: 'A320neo',
      registration: 'D-AINF',
      origin: 'FRA',
      destination: 'FRA',
      standId: 'N8',
      scheduledArrival: getTargetDateISO(11, 30),
      scheduledDeparture: getTargetDateISO(12, 45),
      status: 'SCHEDULED',
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 'FL-1022',
      inboundFlight: 'DL126',
      outboundFlight: 'DL127',
      airlineCode: 'DL',
      airlineName: 'Delta Air Lines',
      aircraftType: 'A330-900neo',
      registration: 'N401DX',
      origin: 'ATL',
      destination: 'JFK',
      standId: 'N10',
      scheduledArrival: getTargetDateISO(10, 45),
      scheduledDeparture: getTargetDateISO(12, 50),
      status: 'SCHEDULED',
      notes: 'Widebody rampa remota/contacto N',
      createdAt: nowIso,
      updatedAt: nowIso
    },

    // Unassigned (Vuelo en cola para asignación manual)
    {
      id: 'FL-1023',
      inboundFlight: 'BA460',
      outboundFlight: 'BA461',
      airlineCode: 'BA',
      airlineName: 'British Airways',
      aircraftType: 'A320-200',
      registration: 'G-EUYL',
      origin: 'LHR',
      destination: 'LHR',
      standId: 'UNASSIGNED',
      scheduledArrival: getTargetDateISO(11, 15),
      scheduledDeparture: getTargetDateISO(12, 30),
      status: 'SCHEDULED',
      notes: 'Pendiente de asignación de stand por dispatcher',
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];
}
