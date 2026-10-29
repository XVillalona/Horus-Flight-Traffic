import React from 'react';
import { FlightAllocation } from '../types/contracts';
import { Clock, Users, Plane, ShieldAlert } from 'lucide-react';

interface FlightHoverCardProps {
  flight: FlightAllocation;
  x: number;
  y: number;
}

export const FlightHoverCard: React.FC<FlightHoverCardProps> = ({ flight, x, y }) => {
  // Dimensiones estimadas para reposicionamiento inteligente
  const cardWidth = 330;
  const cardHeight = 230;
  const padding = 16;

  let left = x + padding;
  let top = y + padding;

  if (typeof window !== 'undefined') {
    if (left + cardWidth > window.innerWidth) {
      left = x - cardWidth - padding;
    }
    if (top + cardHeight > window.innerHeight) {
      top = y - cardHeight - padding;
    }
    left = Math.max(10, left);
    top = Math.max(10, top);
  }

  // Parsear horas exactas
  const getMinutesOfDay = (isoString?: string): number => {
    if (!isoString) return 0;
    const match = isoString.match(/T(\d{2}):(\d{2})/);
    if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    return 0;
  };

  const formatTime = (isoString?: string): string => {
    if (!isoString) return '--:--';
    const match = isoString.match(/T(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    return '--:--';
  };

  const startMin = getMinutesOfDay(flight.scheduledArrival);
  let endMin = getMinutesOfDay(flight.scheduledDeparture);
  if (endMin <= startMin) endMin = startMin + 60;
  const duration = endMin - startMin;
  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;

  const isArajet = flight.airlineCode === 'DM' || flight.aircraftType === '737MAX' || flight.inboundFlight.startsWith('DM');

  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const flightDate = flight.scheduledArrival ? flight.scheduledArrival.slice(0, 10) : '';
  const isToday = flightDate === localToday;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isLiveOnBlock = isToday && (currentMinutes >= startMin && currentMinutes <= endMin);
  const progressPct = isLiveOnBlock ? Math.min(100, Math.max(0, Math.round(((currentMinutes - startMin) / duration) * 100))) : 0;

  const staStr = formatTime(flight.scheduledArrival);
  const stdStr = formatTime(flight.scheduledDeparture);

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md bg-slate-900/95 border border-slate-700/80 shadow-2xl rounded-xl p-3.5 w-80 text-white select-none"
    >
      {/* 1. Header: Aerolínea + Stand + Estado */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center space-x-2">
          {flight.logoUrl ? (
            <img
              src={flight.logoUrl}
              alt={flight.airlineCode}
              className="h-5 max-w-[28px] object-contain rounded bg-white/10 p-0.5"
            />
          ) : (
            <div className="w-5 h-5 rounded bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-[10px]">
              {flight.airlineCode}
            </div>
          )}
          <div>
            <span className={`font-bold text-sm block ${isArajet ? 'text-fuchsia-300' : 'text-white'}`}>
              {flight.airlineName || flight.airlineCode}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Terminal B • {isArajet ? 'Flota Boeing 737 MAX' : flight.aircraftType}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span
            className={`px-2 py-0.5 rounded font-mono font-bold text-xs shadow-sm ${
              isArajet ? 'bg-fuchsia-600 text-white border border-fuchsia-400' : 'bg-blue-600 text-white'
            }`}
          >
            Stand {flight.standId}
          </span>
          {isLiveOnBlock ? (
            <span className="text-[9px] text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>En Rampa ({progressPct}%)</span>
            </span>
          ) : (
            <span className="text-[9px] text-slate-400 mt-0.5">Programado</span>
          )}
        </div>
      </div>

      {/* 2. Rotación de Vuelos (Inbound / Outbound) */}
      <div className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Llegada (STA)</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-bold text-white font-mono">{flight.inboundFlight}</span>
              <span className="text-xs text-blue-400 font-mono bg-blue-950/60 px-1 py-0.2 rounded border border-blue-800/50">
                {staStr}
              </span>
            </div>
          </div>

          <span className="text-slate-600 font-bold text-sm">➔</span>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">Salida (STD)</span>
            <div className="flex items-center justify-end space-x-1.5">
              <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800/50">
                {stdStr}
              </span>
              <span className="text-sm font-bold text-white font-mono">
                {flight.outboundFlight || 'Fin Rotación'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Métricas Operativas: Escala / Turnaround + Pasajeros */}
      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-300 mb-2">
        <div className="bg-slate-800/40 rounded p-1.5 flex items-center space-x-1.5 border border-slate-700/40">
          <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <div>
            <span className="text-[9px] text-slate-400 block">Turnaround</span>
            <span className="font-bold text-amber-300 font-mono text-[11px]">{durationStr}</span>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded p-1.5 flex items-center space-x-1.5 border border-slate-700/40">
          <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <div>
            <span className="text-[9px] text-slate-400 block">Pasajeros</span>
            <span className="font-bold text-sky-200 font-mono text-[11px]">
              {flight.paxIn ?? '--'} In / {flight.paxOut ?? '--'} Out
            </span>
          </div>
        </div>
      </div>

      {/* 4. Ruta (Origen - Escala - Destino) */}
      {flight.route && (
        <div className="flex items-center space-x-1.5 text-[11px] text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2 py-1 rounded mb-1.5 font-mono">
          <Plane className="w-3 h-3 text-sky-400 flex-shrink-0" />
          <span className="truncate">Ruta: {flight.route.replace(/-/g, ' ➔ ')}</span>
        </div>
      )}

      {/* 5. Alerta de Conflicto (si aplica) */}
      {flight.hasConflict && (
        <div className="flex items-center space-x-1.5 text-[10px] text-red-300 bg-red-950/80 border border-red-700/60 px-2 py-1 rounded">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="font-semibold truncate">
            {flight.conflictDetails?.join(', ') || 'Conflicto de solapamiento en stand'}
          </span>
        </div>
      )}
    </div>
  );
};
