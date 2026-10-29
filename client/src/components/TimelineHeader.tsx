import React from 'react';

interface TimelineHeaderProps {
  zoomLevel: number; // Pixels per minute
  currentTimePosition: number; // X offset in pixels for current time
  currentTimeString: string;
  totalHours?: number; // Default 24 hours
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  zoomLevel,
  currentTimePosition,
  currentTimeString,
  totalHours = 24
}) => {
  const hourWidth = zoomLevel * 60; // Ancho en px de 1 hora
  const fiveMinTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700/90 shadow select-none flex">
      {/* Columna fija para los stands a la izquierda */}
      <div className="w-56 flex-shrink-0 bg-slate-950 border-r border-slate-700 p-2 flex items-center justify-between font-bold text-xs text-slate-300 uppercase tracking-wider">
        <span>Stand / Posición</span>
        <span className="text-[10px] text-slate-500 font-normal">Capacidad</span>
      </div>

      {/* Regla de horas con ticks de 5 minutos */}
      <div className="relative flex-1 overflow-visible h-14 bg-slate-900">
        <div className="flex h-full">
          {Array.from({ length: totalHours }).map((_, hour) => (
            <div
              key={hour}
              style={{ width: `${hourWidth}px` }}
              className="flex-shrink-0 border-r border-slate-700/80 flex flex-col justify-between"
            >
              {/* Etiqueta de Hora Principal (Ej. 10, 11, 12...) */}
              <div className="pt-1 px-1.5 flex items-center justify-between text-slate-200">
                <span className="font-bold text-xs font-mono">
                  {String(hour).padStart(2, '0')}:00
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {String(hour).padStart(2, '0')}h
                </span>
              </div>

              {/* Sub-ticks de 5 minutos (00, 05, 10, 15... 55) */}
              <div className="flex h-5 border-t border-slate-800 text-[9px] font-mono text-slate-400">
                {fiveMinTicks.map((tick) => (
                  <div
                    key={tick}
                    style={{ width: `${(hourWidth / 12)}px` }}
                    className="flex-shrink-0 border-r border-slate-800/80 flex items-center justify-center hover:bg-slate-800/50 transition-colors"
                  >
                    {zoomLevel >= 1.5 ? (
                      <span>{String(tick).padStart(2, '0')}</span>
                    ) : (
                      tick % 15 === 0 && <span>{String(tick).padStart(2, '0')}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Indicador de Hora Actual (Barra amarilla con etiqueta igual que en la imagen de referencia) */}
        {currentTimePosition >= 0 && (
          <div
            style={{ left: `${currentTimePosition}px` }}
            className="absolute top-0 bottom-0 pointer-events-none z-40 transform -translate-x-1/2 flex flex-col items-center"
          >
            {/* Cabezal de cursor amarillo */}
            <div className="bg-yellow-400 text-slate-950 font-bold text-[10px] font-mono px-1.5 py-0.5 rounded shadow-lg shadow-yellow-500/40 border border-yellow-300">
              {currentTimeString}
            </div>
            {/* Línea vertical amarilla hacia abajo */}
            <div className="w-[3px] bg-yellow-400 h-full shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          </div>
        )}
      </div>
    </div>
  );
};
