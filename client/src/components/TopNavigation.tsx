import React from 'react';
import { 
  Plane, 
  Upload, 
  Download, 
  Plus, 
  RotateCcw, 
  AlertTriangle, 
  Search, 
  Calendar,
  ZoomIn,
  ZoomOut,
  RefreshCw
} from 'lucide-react';

interface TopNavigationProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates?: { key: string; label: string; count: number }[];
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  zoomLevel: number; // Pixels per minute
  onZoomChange: (zoom: number) => void;
  conflictsCount: number;
  lockTimeOnMove?: boolean;
  onToggleLockTime?: () => void;
  onOpenUpload: () => void;
  onOpenNewFlight: () => void;
  onResetDemo: () => void;
  onDownloadTemplate: () => void;
  totalFlights: number;
  onSyncPuj?: () => void;
  isSyncing?: boolean;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  selectedDate,
  onDateChange,
  availableDates = [],
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  zoomLevel,
  onZoomChange,
  conflictsCount,
  lockTimeOnMove = true,
  onToggleLockTime,
  onOpenUpload,
  onOpenNewFlight,
  onResetDemo,
  onDownloadTemplate,
  totalFlights,
  onSyncPuj,
  isSyncing = false
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm select-none shadow-lg sticky top-0 z-40">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md shadow-blue-500/20 flex items-center justify-center">
          <Plane className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
              Flight Traffic Stand Allocation View
            </h1>
            <span className="bg-blue-900/60 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded border border-blue-700/50">
              HORUS ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Control de Stands B20-B37, N1-N13 & P1-P11 • {totalFlights} vuelos programados
          </p>
        </div>
      </div>

      {/* Date & Filters */}
      <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        <div className="flex items-center space-x-1.5 px-2 text-slate-300">
          <Calendar className="w-4 h-4 text-blue-400" />
          
          {/* Selector de días detectados en el documento */}
          {availableDates.length > 0 && (
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white font-semibold text-xs rounded px-2 py-1 focus:border-blue-500 cursor-pointer mr-1"
            >
              {availableDates.map(d => (
                <option key={d.key} value={d.key}>
                  {d.label} ({d.count} vuelos)
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer w-28"
          />
        </div>

        <div className="h-4 w-px bg-slate-700" />

        {/* Categories */}
        <div className="flex items-center space-x-1">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'B-GATES', label: 'B20-B37' },
            { id: 'N-GATES', label: 'N1-N13' },
            { id: 'P-RAMP', label: 'Remotas P' },
            { id: 'UNASSIGNED', label: 'Sin Asignar' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar vuelo, matrícula, aerolínea..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg w-52 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Toggle Bloqueo de Horario al Mover Vuelo */}
      {onToggleLockTime && (
        <button
          onClick={onToggleLockTime}
          title="Al mover a otro stand, mantiene la hora intacta sin mover la ventana horaria."
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
            lockTimeOnMove
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-sm'
              : 'bg-amber-950/80 border-amber-500 text-amber-300'
          }`}
        >
          <span>{lockTimeOnMove ? '🔒 Hora Fija: ON' : '🔓 Hora Libre: ON'}</span>
        </button>
      )}

      {/* Zoom Controls */}
      <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
        <span className="text-xs text-slate-400 px-1.5 font-mono">Zoom:</span>
        <button
          onClick={() => onZoomChange(Math.max(1.0, zoomLevel - 0.5))}
          title="Reducir zoom"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-blue-300 font-mono w-9 text-center font-semibold">
          {Math.round(zoomLevel * 30)}m
        </span>
        <button
          onClick={() => onZoomChange(Math.min(5.0, zoomLevel + 0.5))}
          title="Aumentar zoom"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Conflict Badge */}
      {conflictsCount > 0 ? (
        <div className="flex items-center space-x-1.5 bg-red-950/80 text-red-300 border border-red-800/80 px-2.5 py-1 rounded-lg text-xs font-semibold flight-conflict-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>{conflictsCount} Solapamiento{conflictsCount > 1 ? 's' : ''}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-emerald-400 text-xs font-medium bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
          <span>Sin conflictos</span>
        </div>
      )}

      {/* Actions Group */}
      <div className="flex items-center space-x-2">
        {onSyncPuj && (
          <button
            onClick={onSyncPuj}
            disabled={isSyncing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 shadow transition"
            title="Sincronizar vuelos en tiempo real con Dashboard PUJ (Terminal B)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar PUJ (B)'}</span>
          </button>
        )}

        <button
          onClick={onOpenNewFlight}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Vuelo</span>
        </button>

        <button
          onClick={onOpenUpload}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow transition"
          title="Cargar archivo Excel o CSV diario/semanal"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Subir Excel/CSV</span>
        </button>

        <button
          onClick={onDownloadTemplate}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition"
          title="Descargar plantilla Excel oficial de asignación"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Plantilla</span>
        </button>

        <button
          onClick={onResetDemo}
          className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 border border-slate-700 text-xs p-1.5 rounded-lg transition"
          title="Restaurar datos de demostración"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
