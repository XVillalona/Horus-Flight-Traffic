import React, { useState } from 'react';
import { FlightAllocation } from '../types/contracts';
import { AlertCircle, Clock } from 'lucide-react';

interface FlightBarProps {
  flight: FlightAllocation;
  zoomLevel: number; // Pixels per minute
  dayStartMinutes: number; // e.g. 0 (00:00)
  onSelect: (flight: FlightAllocation) => void;
  onDragStart: (e: React.DragEvent, flight: FlightAllocation) => void;
  onResizeTime?: (flightId: string, edge: 'start' | 'end', deltaMinutes: number) => void;
}

export const FlightBar: React.FC<FlightBarProps> = ({
  flight,
  zoomLevel,
  dayStartMinutes,
  onSelect,
  onDragStart
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Calcular minutos desde medianoche (aislado de desfasaje de zona horaria)
  const getMinutesOfDay = (isoString: string): number => {
    try {
      if (!isoString) return 0;
      const match = isoString.match(/T(\d{2}):(\d{2})/);
      if (match) {
        return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
      const d = new Date(isoString);
      return d.getHours() * 60 + d.getMinutes();
    } catch {
      return 0;
    }
  };

  const startMinutes = getMinutesOfDay(flight.scheduledArrival);
  let endMinutes = getMinutesOfDay(flight.scheduledDeparture);

  // Si cruza medianoche o termina antes
  if (endMinutes <= startMinutes) {
    endMinutes = startMinutes + 60; // Fallback mínimo 60 min
  }

  const durationMinutes = Math.max(20, endMinutes - startMinutes);
  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const durationStr = durationHours > 0 ? (durationMins > 0 ? `${durationHours}h ${durationMins}m` : `${durationHours}h`) : `${durationMins}m`;
  const isTightTurn = durationMinutes <= 50;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isCurrentlyOnBlock = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  const progressPct = isCurrentlyOnBlock ? Math.min(100, Math.max(0, Math.round(((currentMinutes - startMinutes) / durationMinutes) * 100))) : 0;

  const leftPx = (startMinutes - dayStartMinutes) * zoomLevel;
  const widthPx = Math.max(60, durationMinutes * zoomLevel);

  // Formato horas HH:mm exacto (sin alteración UTC)
  const formatTime = (isoString: string): string => {
    try {
      if (!isoString) return '--:--';
      const match = isoString.match(/T(\d{2}):(\d{2})/);
      if (match) {
        return `${match[1]}:${match[2]}`;
      }
      const d = new Date(isoString);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '--:--';
    }
  };

  const arrivalFormatted = formatTime(flight.scheduledArrival);
  const departureFormatted = formatTime(flight.scheduledDeparture);

  const isArajet = flight.airlineCode === 'DM' || flight.aircraftType === '737MAX' || flight.inboundFlight.startsWith('DM');

  // Paleta de colores según estado
  const getTheme = () => {
    if (flight.hasConflict) {
      return {
        bg: 'from-red-950/90 to-red-900/90 border-red-500 shadow-red-500/30',
        stripe: 'bg-red-500 animate-pulse',
        badge: 'bg-red-500 text-white',
        text: 'text-red-100'
      };
    }
    if (isArajet) {
      return {
        bg: 'from-indigo-950/90 to-blue-900/80 border-indigo-500/80 shadow-indigo-500/20',
        stripe: 'bg-indigo-400',
        badge: 'bg-indigo-600 text-white font-bold border border-indigo-400',
        text: 'text-indigo-100'
      };
    }
    if (flight.status === 'ON_BLOCK') {
      return {
        bg: 'from-emerald-950/80 to-slate-800/90 border-emerald-500/70 shadow-emerald-500/10',
        stripe: 'bg-emerald-400',
        badge: 'bg-emerald-500 text-slate-950 font-bold',
        text: 'text-emerald-100'
      };
    }
    if (durationMinutes > 120) {
      return {
        bg: 'from-purple-950/80 to-slate-800/90 border-purple-500/70 shadow-purple-500/10',
        stripe: 'bg-purple-400',
        badge: 'bg-purple-400 text-slate-950 font-bold',
        text: 'text-purple-100'
      };
    }
    // Estándar programado
    return {
      bg: 'from-sky-950/80 to-slate-800/90 border-sky-500/60 shadow-sky-500/10',
      stripe: 'bg-sky-400',
      badge: 'bg-amber-400 text-slate-950 font-bold',
      text: 'text-sky-100'
    };
  };

  const theme = getTheme();

  return (
    <div
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`
      }}
      draggable
      onDragStart={(e) => onDragStart(e, flight)}
      onClick={() => onSelect(flight)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${flight.inboundFlight}${flight.outboundFlight ? ' / ' + flight.outboundFlight : ''} (${flight.aircraftType}) - ${arrivalFormatted} a ${departureFormatted}${flight.route ? ' | Ruta: ' + flight.route : ''}`}
      className={`absolute top-1 bottom-1 rounded-md border shadow-md cursor-grab active:cursor-grabbing select-none overflow-hidden transition-shadow flex flex-col justify-between group bg-gradient-to-r ${theme.bg} ${
        flight.hasConflict ? 'ring-2 ring-red-500 flight-conflict-pulse z-20' : 'hover:z-20 hover:border-blue-400'
      }`}
    >
      {/* Franja superior de estado */}
      <div className={`h-1.5 w-full ${theme.stripe} relative z-10`} />

      {/* Barra de progreso en rampa (Si está en rampa hoy) */}
      {isCurrentlyOnBlock && (
        <div 
          style={{ width: `${progressPct}%` }}
          className="absolute bottom-0 left-0 h-1 bg-emerald-400 shadow-[0_0_8px_#34d399] z-10 transition-all duration-300"
        />
      )}

      {/* Contenido principal del bloque de vuelo con IN / OUT */}
      <div className="px-2 py-0.5 flex items-center justify-between gap-1 flex-1 min-w-0 relative z-10">
        <div className="flex items-center space-x-1.5 min-w-0">
          {flight.logoUrl && (
            <img src={flight.logoUrl} alt={flight.airlineCode} className="h-3.5 max-w-[22px] object-contain rounded bg-white/10 px-0.5" />
          )}
          <span className={`text-[9px] px-1 rounded uppercase font-mono shadow-sm flex-shrink-0 ${theme.badge}`}>
            {flight.airlineCode || 'FL'}
          </span>
          <span className="text-[10px] text-slate-300" title="Llegada">🛬</span>
          <span className="font-bold text-xs tracking-tight truncate text-white" title="Llegada">
            {flight.inboundFlight}
          </span>
        </div>

        {flight.outboundFlight && (
          <div className="text-right flex items-center space-x-1 text-slate-300 min-w-0 flex-shrink-0" title="Salida">
            <span className="text-[10px] text-slate-400 font-bold">/</span>
            <span className="text-[10px] text-emerald-400" title="Salida">🛫</span>
            <span className="font-bold text-xs tracking-tight truncate text-slate-200">
              {flight.outboundFlight}
            </span>
          </div>
        )}
      </div>

      {/* Franja inferior: Horas, Duración de Escala y Tipo de Avión */}
      <div className="px-2 pb-0.5 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-700/50 bg-slate-900/50 relative z-10">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5 text-slate-400" />
          {arrivalFormatted}-{departureFormatted}
          {isTightTurn ? (
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 rounded text-[8px] font-bold">
              ⚡ {durationStr}
            </span>
          ) : (
            <span className="text-slate-400 text-[8px]">
              ⏱️ {durationStr}
            </span>
          )}
        </span>
        <span className={`truncate max-w-[80px] text-right font-medium ${isArajet ? 'text-indigo-300 font-bold' : 'text-slate-300'}`}>
          {isArajet ? '737 MAX' : flight.aircraftType} {flight.registration ? `• ${flight.registration}` : ''}
        </span>
      </div>

      {/* Alerta de Conflicto Icono */}
      {flight.hasConflict && (
        <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md z-20">
          <AlertCircle className="w-3 h-3" />
        </div>
      )}

      {/* Tooltip flotante enriquecido al pasar el mouse */}
      {isHovered && (
        <div className="absolute -top-20 left-0 bg-slate-950/95 backdrop-blur-md text-white text-xs p-2.5 rounded-xl shadow-2xl border border-blue-500/40 z-50 pointer-events-none min-w-[240px] whitespace-normal">
          <div className="font-bold text-blue-400 flex items-center justify-between pb-1 border-b border-slate-800">
            <span>🛬 {flight.inboundFlight} {flight.outboundFlight ? `➔ 🛫 ${flight.outboundFlight}` : ''}</span>
            <span className="bg-blue-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">{flight.standId}</span>
          </div>
          <div className="text-[11px] text-slate-200 mt-1 flex items-center justify-between">
            <span>{arrivalFormatted} - {departureFormatted}</span>
            <span className="font-mono text-amber-300">⏱️ Escala: {durationStr}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {flight.airlineName} • {isArajet ? 'Boeing 737 MAX' : flight.aircraftType} {flight.registration ? `(${flight.registration})` : ''}
          </div>
          {flight.route && (
            <div className="text-[10px] text-sky-300 mt-0.5 font-mono">
              ✈️ {flight.route.replace(/-/g, ' ➔ ')}
            </div>
          )}
          {flight.hasConflict && (
            <div className="text-red-400 text-[10px] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {flight.conflictDetails?.join(', ') || 'Conflicto de solapamiento en este stand'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
