import React, { useState, useEffect, useRef } from 'react';
import { useStandAllocation } from './hooks/useStandAllocation';
import { TopNavigation } from './components/TopNavigation';
import { TimelineHeader } from './components/TimelineHeader';
import { StandTrack } from './components/StandTrack';
import { ConflictWarningBanner } from './components/ConflictWarningBanner';
import { FlightEditModal } from './components/FlightEditModal';
import { FlightAllocation } from './types/contracts';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    stands,
    allStands,
    flights,
    conflicts,
    isLoading,
    error,
    availableDates,
    selectedDate,
    setSelectedDate,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    zoomLevel,
    setZoomLevel,
    currentTimePosition,
    currentTimeString,
    lockTimeOnMove,
    setLockTimeOnMove,
    handleDragStart,
    handleDropFlightOnStand,
    handleSaveFlight,
    handleDeleteFlight,
    handleResetDemo,
    refreshData,
    syncPuj,
    isSyncing
  } = useStandAllocation();

  // Estados de Modales
  const [editingFlight, setEditingFlight] = useState<FlightAllocation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Referencia para scroll automático hacia la hora actual en carga inicial
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const hasAutoScrolled = useRef(false);

  useEffect(() => {
    if (!isLoading && currentTimePosition > 0 && !hasAutoScrolled.current && timelineScrollRef.current) {
      // Centrar el scroll horizontal alrededor de la hora actual
      const containerWidth = timelineScrollRef.current.clientWidth;
      const targetScroll = Math.max(0, currentTimePosition - containerWidth / 3);
      timelineScrollRef.current.scrollLeft = targetScroll;
      hasAutoScrolled.current = true;
    }
  }, [isLoading, currentTimePosition]);

  // Abrir modal de edición
  const handleSelectFlight = (flight: FlightAllocation) => {
    setEditingFlight(flight);
    setIsEditModalOpen(true);
  };

  // Crear nuevo vuelo en blanco
  const handleOpenNewFlight = () => {
    const flightDate = selectedDate || new Date().toISOString().slice(0, 10);

    const newFlightTemplate: FlightAllocation = {
      id: '',
      inboundFlight: '',
      outboundFlight: '',
      airlineCode: 'IB',
      airlineName: 'Iberia',
      aircraftType: 'A320',
      standId: stands[1]?.id || 'B20',
      scheduledArrival: `${flightDate}T12:00:00.000Z`,
      scheduledDeparture: `${flightDate}T13:15:00.000Z`,
      status: 'SCHEDULED'
    };

    setEditingFlight(newFlightTemplate);
    setIsEditModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Barra de Navegación y Herramientas */}
      <TopNavigation
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableDates={availableDates}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        conflictsCount={conflicts.length}
        lockTimeOnMove={lockTimeOnMove}
        onToggleLockTime={() => setLockTimeOnMove(!lockTimeOnMove)}
        onOpenNewFlight={handleOpenNewFlight}
        onResetDemo={handleResetDemo}
        totalFlights={flights.length}
        onSyncPuj={syncPuj}
        isSyncing={isSyncing}
      />

      {/* 2. Banner de Conflictos Operativos (si existen) */}
      <ConflictWarningBanner
        conflicts={conflicts}
        onSelectStand={(standId) => {
          setSelectedCategory('ALL');
          setSearchQuery(standId);
        }}
      />

      {/* 3. Área Principal de la Línea de Tiempo / Gantt */}
      <div
        ref={timelineScrollRef}
        className="flex-1 overflow-auto relative bg-slate-950"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400 font-medium">
              Cargando asignación de stands y matriz de vuelos...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p className="font-semibold text-base mb-2">Error de comunicación</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={refreshData}
              className="mt-4 bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg border border-slate-700"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="inline-block min-w-full">
            {/* Cabecera de Horas y Marcador Amarillo */}
            <TimelineHeader
              zoomLevel={zoomLevel}
              currentTimePosition={currentTimePosition}
              currentTimeString={currentTimeString}
              totalHours={24}
            />

            {/* Pistas de Stands */}
            <div className="flex flex-col divide-y divide-slate-800/80">
              {stands.map((stand) => {
                const standFlights = flights.filter((f) => f.standId === stand.id);
                return (
                  <StandTrack
                    key={stand.id}
                    stand={stand}
                    flights={standFlights}
                    zoomLevel={zoomLevel}
                    dayStartMinutes={0}
                    totalHours={24}
                    currentTimePosition={currentTimePosition}
                    lockTimeOnMove={lockTimeOnMove}
                    onSelectFlight={handleSelectFlight}
                    onDragStartFlight={handleDragStart}
                    onDropFlightOnStand={handleDropFlightOnStand}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Modales de Gestión */}
      <FlightEditModal
        flight={editingFlight}
        stands={allStands}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveFlight}
        onDelete={handleDeleteFlight}
      />
    </div>
  );
};

export default App;
