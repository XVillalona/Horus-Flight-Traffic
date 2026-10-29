export type StandCategory = 'UNASSIGNED' | 'B-GATES' | 'N-GATES' | 'P-RAMP';

export interface Stand {
  id: string;               // e.g., "UNASSIGNED", "B20", "B23A", "B23B", "N6", "P1"
  name: string;             // Display name, e.g., "Stand B23A", "Stand P6"
  category: StandCategory;  // Category grouping
  order: number;            // Order on Y axis (0, 1, 2, ...)
  maxAircraftSize: string;  // e.g., "Narrowbody", "Widebody", "737MAX/A320", "All"
  terminal: string;         // e.g., "Terminal B", "Terminal N", "Plataforma P", "Rampa"
  description?: string;
}

export type FlightStatus = 'SCHEDULED' | 'ON_BLOCK' | 'DEPARTED' | 'DELAYED' | 'CONFLICT';

export interface FlightAllocation {
  id: string;               // Unique flight allocation ID (e.g. UUID)
  inboundFlight: string;    // Inbound flight number (e.g. "DM6207", "6207", "IB3111")
  outboundFlight?: string;  // Outbound flight number (e.g. "DM1732", "1732", "IB3110")
  airlineCode: string;      // 2-letter airline code (e.g. "DM", "B6", "AA", "CM", "IB")
  airlineName: string;      // Airline display name (e.g. "Arajet", "Jetblue Airways")
  aircraftType: string;     // e.g. "737MAX" (Arajet), "A320", "A321", "B738"
  registration?: string;    // Aircraft registration tail (e.g. "HI1026", "EC-MOU")
  origin?: string;          // Origin airport IATA (e.g. "ROS", "MAD", "JFK")
  destination?: string;     // Destination airport IATA (e.g. "MDE", "BCN", "MIA")
  route?: string;           // Full Route (e.g. "ROS-PUJ-MDE")
  paxIn?: number;           // Passengers In
  paxOut?: number;          // Passengers Out
  logoUrl?: string;         // Airline logo image URL
  standId: string;          // Assigned Stand ID or "UNASSIGNED"
  
  // Date/Time in ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  scheduledArrival: string;   // Scheduled Time of Arrival (STA)
  scheduledDeparture: string; // Scheduled Time of Departure (STD)
  estimatedArrival?: string;  // Estimated Time of Arrival (ETA)
  estimatedDeparture?: string;// Estimated Time of Departure (ETD)
  actualArrival?: string;     // Actual In-Block (ATA)
  actualDeparture?: string;   // Actual Off-Block (ATD)
  
  status: FlightStatus;
  hasConflict?: boolean;
  conflictDetails?: string[];
  color?: string;             // Optional custom UI color tag
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictRecord {
  standId: string;
  conflictingFlightIds: string[];
  overlapStart: string;
  overlapEnd: string;
  description: string;
}

export interface DatabaseState {
  version: string;
  lastUpdated: string;
  stands: Stand[];
  flights: FlightAllocation[];
}
