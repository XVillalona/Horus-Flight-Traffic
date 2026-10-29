import React, { useState } from 'react';
import { ConflictRecord } from '../types/contracts';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface ConflictWarningBannerProps {
  conflicts: ConflictRecord[];
  onSelectStand: (standId: string) => void;
}

export const ConflictWarningBanner: React.FC<ConflictWarningBannerProps> = ({
  conflicts,
  onSelectStand
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-red-950/90 border-b border-red-700/80 px-4 py-2 text-xs text-red-200 select-none shadow-md z-30 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 bg-red-600 text-white rounded">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">
              ¡Alerta de Operaciones! Se han detectado {conflicts.length} conflicto(s) de stand simultáneo.
            </span>
            <span className="text-red-300 ml-2 hidden sm:inline">
              Dos o más aeronaves han sido programadas en la misma posición en horarios solapados.
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 bg-red-900/60 hover:bg-red-800/80 text-white font-medium px-2 py-1 rounded transition border border-red-700/60"
        >
          <span>{isExpanded ? 'Ocultar detalles' : 'Ver conflictos'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-red-800/60 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className="bg-red-900/40 border border-red-700/60 p-2 rounded flex items-center justify-between hover:bg-red-900/70 transition cursor-pointer"
              onClick={() => onSelectStand(conflict.standId)}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white">Stand {conflict.standId}: </span>
                  <span className="text-[11px] text-red-200">{conflict.description}</span>
                </div>
              </div>
              <span className="text-[10px] bg-red-800 text-white px-1.5 py-0.5 rounded font-mono ml-2 flex-shrink-0">
                Ir a Stand
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
