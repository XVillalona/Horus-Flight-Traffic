import React, { useState } from 'react';
import { Stand, FlightAllocation } from '../types/contracts';
import { FlightBar } from './FlightBar';

interface StandTrackProps {
  stand: Stand;
  flights: FlightAllocation[];
  zoomLevel: number; // Pixels per minute
  dayStartMinutes: number;
  totalHours: number;
  currentTimePosition: number;
  lockTimeOnMove?: boolean;
  onSelectFlight: (flight: FlightAllocation) => void;
  onDragStartFlight: (e: React.DragEvent, flight: FlightAllocation) => void;
  onDropFlightOnStand: (standId: string, timeOffsetMinutes?: number, preserveTime?: boolean) => void;
}

export const StandTrack: React.FC<StandTrackProps> = ({
  stand,
  flights,
  zoomLevel,
  dayStartMinutes,
  totalHours,
  currentTimePosition,
  lockTimeOnMove = true,
  onSelectFlight,
  onDragStartFlight,
  onDropFlightOnStand
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const hourWidth = zoomLevel * 60;
  const isUnassigned = stand.id === 'UNASSIGNED';
  const isB23Split = stand.id === 'B23A' || stand.id === 'B23B';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // REQUERIMIENTO: Al mover vuelo no cambiar de hora, solo de lugar
    const isShiftPressed = e.shiftKey;
    if (lockTimeOnMove && !isShiftPressed) {
      onDropFlightOnStand(stand.id, undefined, true);
      return;
    }

    // Calcular la posición X relativa dentro de la pista para obtener la nueva hora
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const rawMinutes = Math.floor(clickX / zoomLevel);

    // Ajustar a múltiplos de 5 minutos (snap to 5-min grid)
    const snappedMinutes = Math.round(rawMinutes / 5) * 5;

    onDropFlightOnStand(stand.id, Math.max(0, snappedMinutes), false);
  };

  return (
    <div
      className={`flex border-b border-slate-800 transition-colors ${
        isUnassigned
          ? 'bg-amber-950/20 hover:bg-amber-950/30'
          : stand.order % 2 === 0
          ? 'bg-slate-900/60 hover:bg-slate-800/40'
          : 'bg-slate-900/30 hover:bg-slate-800/30'
      } ${isDragOver ? 'bg-blue-950/60 ring-2 ring-blue-500 ring-inset' : ''}`}
    >
      {/* Columna Izquierda: Identificador del Stand */}
      <div
        className={`w-56 flex-shrink-0 px-3 py-2 flex items-center justify-between border-r border-slate-700/80 sticky left-0 z-20 select-none ${
          isUnassigned
            ? 'bg-amber-950/80 text-amber-200'
            : isB23Split
            ? 'bg-slate-950 text-blue-200'
            : 'bg-slate-950 text-slate-200'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className={`font-bold text-xs tracking-wide ${isUnassigned ? 'text-amber-300' : 'text-white'}`}>
              {stand.name}
            </span>
            {isB23Split && (
              <span className="text-[9px] bg-blue-900/80 text-blue-300 border border-blue-700 px-1 rounded font-mono">
                Dividida
              </span>
            )}
            {isUnassigned && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-600/40 px-1 rounded">
                Buffer
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {stand.maxAircraftSize.split('(')[0]}
          </span>
        </div>

        <span className="text-[10px] text-slate-500 uppercase font-mono px-1 py-0.5 rounded bg-slate-900/80 border border-slate-800">
          {stand.terminal.replace('Terminal ', 'T')}
        </span>
      </div>

      {/* Pista de tiempo horizontal (Track donde se sitúan los vuelos) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative flex-1 h-14 overflow-visible timeline-grid-cell"
        style={{ width: `${totalHours * hourWidth}px` }}
      >
        {/* Líneas divisorias de horas en el fondo */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: totalHours }).map((_, hour) => (
            <div
              key={hour}
              style={{ width: `${hourWidth}px` }}
              className="flex-shrink-0 border-r border-slate-800/60 h-full"
            />
          ))}
        </div>

        {/* Indicador de Hora Actual vertical en la pista */}
        {currentTimePosition >= 0 && (
          <div
            style={{ left: `${currentTimePosition}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-10 transform -translate-x-1/2 w-[3px] bg-yellow-400/80 shadow-[0_0_6px_rgba(250,204,21,0.6)]"
          />
        )}

        {/* Renderizado de Bloques de Vuelos en este Stand */}
        {flights.map((flight) => (
          <FlightBar
            key={flight.id}
            flight={flight}
            zoomLevel={zoomLevel}
            dayStartMinutes={dayStartMinutes}
            onSelect={onSelectFlight}
            onDragStart={onDragStartFlight}
          />
        ))}

        {/* Indicador visual cuando se arrastra sobre este stand */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/20 pointer-events-none flex items-center justify-center text-xs font-semibold text-blue-200">
            Soltar para asignar a {stand.name}
          </div>
        )}
      </div>
    </div>
  );
};
