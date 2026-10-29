export type StandCategory = 'UNASSIGNED' | 'B-GATES' | 'N-GATES' | 'P-RAMP';

export interface Stand {
  id: string;               // e.g., "UNASSIGNED", "B20", "B23A", "B23B", "N6", "P1"
  name: string;             // Display name, e.g., "Stand B23A", "Stand P6"
  category: StandCategory;
  order: number;
  maxAircraftSize: string;
  terminal: string;
  description?: string;
}

export type FlightStatus = 'SCHEDULED' | 'ON_BLOCK' | 'DEPARTED' | 'DELAYED' | 'CONFLICT';

export interface FlightAllocation {
  id: string;
  inboundFlight: string;
  outboundFlight?: string;
  airlineCode: string;
  airlineName: string;
  aircraftType: string;
  registration?: string;
  origin?: string;
  destination?: string;
  route?: string;
  paxIn?: number;
  paxOut?: number;
  logoUrl?: string;
  standId: string;
  scheduledArrival: string;   // ISO string (STA)
  scheduledDeparture: string; // ISO string (STD)
  estimatedArrival?: string;
  estimatedDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  status: FlightStatus;
  hasConflict?: boolean;
  conflictDetails?: string[];
  color?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConflictRecord {
  standId: string;
  conflictingFlightIds: string[];
  overlapStart: string;
  overlapEnd: string;
  description: string;
}

export interface StandChangeRecord {
  flightId: string;
  inboundFlight: string;
  airlineName: string;
  airlineCode: string;
  previousStand: string;
  newStand: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  flightDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  conflictsCount?: number;
  conflicts?: ConflictRecord[];
  error?: {
    code: string;
    message: string;
  };
}
