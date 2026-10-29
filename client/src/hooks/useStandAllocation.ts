import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stand, FlightAllocation, ConflictRecord } from '../types/contracts';

export function useStandAllocation() {
  const [stands, setStands] = useState<Stand[]>([]);
  const [flights, setFlights] = useState<FlightAllocation[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros & Visualización
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(2.0); // 2 px por minuto = 120 px por hora

  // Estado de Arrastre (Drag & Drop)
  const [draggedFlight, setDraggedFlight] = useState<FlightAllocation | null>(null);

  // Estado de Hora Actual para el Scrubber Amarillo
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Actualizar reloj cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Cargar Stands
  const fetchStands = useCallback(async () => {
    try {
      const res = await fetch('/api/stands');
      const data = await res.json();
      if (data.success) {
        setStands(data.data);
      }
    } catch (err: any) {
      console.error('Error al cargar stands:', err);
    }
  }, []);

  // Cargar Vuelos
  const fetchFlights = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/flights');
      const data = await res.json();
      if (data.success) {
        setFlights(data.data);
        setConflicts(data.conflicts || []);
        setError(null);
      } else {
        setError(data.error?.message || 'Error al obtener vuelos');
      }
    } catch (err: any) {
      setError(`Error de conexión con el backend: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronización en tiempo real con Dashboard PUJ (Redash) - Terminal B
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [standChanges, setStandChanges] = useState<any[]>([]);

  const syncPuj = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/sync/redash', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFlights(data.data);
        setConflicts(data.conflicts || []);
        if (Array.isArray(data.standChanges) && data.standChanges.length > 0) {
          setStandChanges(data.standChanges);
        }
        setSyncStatus(data.status);
        setError(null);
        return data;
      } else {
        throw new Error(data.error?.message || 'Error al sincronizar con Redash PUJ');
      }
    } catch (err: any) {
      setError(`Error de sincronización con PUJ: ${err.message}`);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Polling automático cada 5 minutos en el cliente React
  useEffect(() => {
    const timer = setInterval(() => {
      syncPuj().catch(console.error);
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [syncPuj]);

  useEffect(() => {
    fetchStands();
    fetchFlights();
  }, [fetchStands, fetchFlights]);

  // Bloqueo de hora al arrastrar (True por defecto: solo cambia de stand)
  const [lockTimeOnMove, setLockTimeOnMove] = useState<boolean>(true);

  // Arrastrar Vuelo - Inicio
  const handleDragStart = (e: React.DragEvent, flight: FlightAllocation) => {
    setDraggedFlight(flight);
    e.dataTransfer.setData('text/plain', flight.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Soltar Vuelo en un Stand (Reasignación de Stand + Preservar Horas si lockTimeOnMove está activo)
  const handleDropFlightOnStand = async (targetStandId: string, timeOffsetMinutes?: number, preserveTime: boolean = true) => {
    if (!draggedFlight) return;

    let newArrivalIso = draggedFlight.scheduledArrival;
    let newDepartureIso = draggedFlight.scheduledDeparture;

    // Solo calcular nueva hora si explícitamente se solicita no preservar la hora
    if (!preserveTime && timeOffsetMinutes !== undefined) {
      const startOrig = new Date(draggedFlight.scheduledArrival).getTime();
      const endOrig = new Date(draggedFlight.scheduledDeparture).getTime();
      const durationMs = Math.max(20 * 60 * 1000, endOrig - startOrig);

      const targetHours = String(Math.floor(timeOffsetMinutes / 60)).padStart(2, '0');
      const targetMins = String(timeOffsetMinutes % 60).padStart(2, '0');
      newArrivalIso = `${selectedDate}T${targetHours}:${targetMins}:00.000Z`;

      const durationMinutes = Math.max(20, Math.round(durationMs / 60000));
      const endTotalMinutes = parseInt(targetHours, 10) * 60 + parseInt(targetMins, 10) + durationMinutes;
      const endHours = String(Math.floor(endTotalMinutes / 60) % 24).padStart(2, '0');
      const endMins = String(endTotalMinutes % 60).padStart(2, '0');
      newDepartureIso = `${selectedDate}T${endHours}:${endMins}:00.000Z`;
    }

    // Actualización optimista inmediata en cliente para 60fps sin retardo
    const updatedLocalFlights = flights.map((f) =>
      f.id === draggedFlight.id
        ? {
            ...f,
            standId: targetStandId,
            scheduledArrival: newArrivalIso,
            scheduledDeparture: newDepartureIso
          }
        : f
    );
    setFlights(updatedLocalFlights);

    // Enviar cambio al backend
    try {
      const res = await fetch(`/api/flights/${draggedFlight.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStandId: targetStandId,
          newScheduledArrival: newArrivalIso,
          newScheduledDeparture: newDepartureIso
        })
      });

      const data = await res.json();
      if (data.success) {
        setConflicts(data.conflicts || []);
        fetchFlights(); // Refrescar estado consolidado
      }
    } catch (err) {
      console.error('Error al mover vuelo:', err);
      fetchFlights(); // Rollback en caso de error
    } finally {
      setDraggedFlight(null);
    }
  };

  // Guardar o Actualizar Vuelo
  const handleSaveFlight = async (flightData: Partial<FlightAllocation>) => {
    try {
      const isNew = !flightData.id;
      const url = isNew ? '/api/flights' : `/api/flights/${flightData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flightData)
      });

      const data = await res.json();
      if (data.success) {
        fetchFlights();
      } else {
        alert(`Error al guardar vuelo: ${data.error?.message || 'Error desconocido'}`);
      }
    } catch (err: any) {
      alert(`Error de red al guardar vuelo: ${err.message}`);
    }
  };

  // Eliminar Vuelo
  const handleDeleteFlight = async (flightId: string) => {
    try {
      const res = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchFlights();
      }
    } catch (err: any) {
      console.error('Error al eliminar vuelo:', err);
    }
  };

  // Restaurar Demo
  const handleResetDemo = async () => {
    if (window.confirm('¿Deseas restaurar la asignación inicial de vuelos de demostración?')) {
      try {
        const res = await fetch('/api/flights/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          fetchFlights();
        }
      } catch (err: any) {
        console.error('Error al restaurar demo:', err);
      }
    }
  };

  // Descargar Plantilla
  const handleDownloadTemplate = () => {
    window.open('/api/upload/template', '_blank');
  };

  // Fechas disponibles detectadas en la lista de vuelos
  const availableDates = useMemo(() => {
    const map = new Map<string, number>();
    flights.forEach((f) => {
      const d = f.scheduledArrival ? f.scheduledArrival.slice(0, 10) : '';
      if (d && !isNaN(Date.parse(d))) {
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => {
        let label = key;
        try {
          const parts = key.split('-');
          if (parts.length === 3) {
            const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            label = dt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
            label = label.charAt(0).toUpperCase() + label.slice(1);
          }
        } catch (_) {}
        return { key, label, count };
      });
  }, [flights]);

  // Si hay fechas disponibles y selectedDate no está entre ellas, seleccionar la primera
  useEffect(() => {
    if (availableDates.length > 0 && !availableDates.some((d) => d.key === selectedDate)) {
      setSelectedDate(availableDates[0].key);
    }
  }, [availableDates, selectedDate]);

  // Filtrado de Stands
  const filteredStands = useMemo(() => {
    return stands.filter((stand) => {
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'B-GATES') return stand.category === 'B-GATES';
      if (selectedCategory === 'N-GATES') return stand.category === 'N-GATES';
      if (selectedCategory === 'P-RAMP') return stand.category === 'P-RAMP';
      if (selectedCategory === 'UNASSIGNED') return stand.category === 'UNASSIGNED';
      return true;
    });
  }, [stands, selectedCategory]);

  // Filtrado de Vuelos por Búsqueda y Fecha
  const filteredFlights = useMemo(() => {
    let result = flights;

    // Filtro por fecha seleccionada
    if (selectedDate) {
      result = result.filter((f) => f.scheduledArrival && f.scheduledArrival.slice(0, 10) === selectedDate);
    }

    // Filtro de texto de búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.inboundFlight.toLowerCase().includes(q) ||
          f.outboundFlight?.toLowerCase().includes(q) ||
          f.airlineName.toLowerCase().includes(q) ||
          f.aircraftType.toLowerCase().includes(q) ||
          f.registration?.toLowerCase().includes(q) ||
          f.standId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [flights, selectedDate, searchQuery]);

  // Posición del Scrubber Amarillo de Hora Actual (Solo visible si selectedDate es HOY)
  const currentTimePosition = useMemo(() => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const utcToday = now.toISOString().slice(0, 10);

    // Si el usuario está viendo mañana o días pasados, ocultar el indicador de hora actual
    if (selectedDate && selectedDate !== localToday && selectedDate !== utcToday) {
      return -1;
    }

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currentMinutes * zoomLevel;
  }, [currentTime, zoomLevel, selectedDate]);

  const currentTimeString = useMemo(() => {
    return `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  }, [currentTime]);

  return {
    stands: filteredStands,
    allStands: stands,
    flights: filteredFlights,
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
    handleDownloadTemplate,
    refreshData: fetchFlights,
    syncPuj,
    isSyncing,
    syncStatus,
    standChanges,
    clearStandChanges: () => setStandChanges([])
  };
}
