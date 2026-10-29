import React, { useState, useEffect } from 'react';
import { FlightAllocation, Stand, FlightStatus } from '../types/contracts';
import { X, Trash2, Save, Plane, Clock, MapPin, AlertCircle } from 'lucide-react';

interface FlightEditModalProps {
  flight: FlightAllocation | null;
  stands: Stand[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Partial<FlightAllocation>) => void;
  onDelete: (flightId: string) => void;
}

export const FlightEditModal: React.FC<FlightEditModalProps> = ({
  flight,
  stands,
  isOpen,
  onClose,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<FlightAllocation>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (flight) {
      setFormData({
        ...flight,
        // Convertir ISO a formato local input datetime-local: YYYY-MM-DDTHH:mm
        scheduledArrival: flight.scheduledArrival ? flight.scheduledArrival.slice(0, 16) : '',
        scheduledDeparture: flight.scheduledDeparture ? flight.scheduledDeparture.slice(0, 16) : ''
      });
      setErrorMsg(null);
    }
  }, [flight]);

  if (!isOpen || !flight) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.inboundFlight?.trim()) {
      setErrorMsg('El número de vuelo de llegada es obligatorio.');
      return;
    }

    if (!formData.scheduledArrival || !formData.scheduledDeparture) {
      setErrorMsg('Las horas de llegada y salida son obligatorias.');
      return;
    }

    const start = new Date(formData.scheduledArrival).getTime();
    const end = new Date(formData.scheduledDeparture).getTime();

    if (end <= start) {
      setErrorMsg('La hora de salida (STD) debe ser posterior a la hora de llegada (STA).');
      return;
    }

    const formatPayloadDate = (val: string): string => {
      if (!val) return '';
      if (val.length === 16) {
        return `${val}:00.000Z`;
      }
      return val;
    };

    onSave({
      ...formData,
      scheduledArrival: formatPayloadDate(formData.scheduledArrival),
      scheduledDeparture: formatPayloadDate(formData.scheduledDeparture)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-lg border border-blue-500/30">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Vuelo {formData.inboundFlight || 'Nuevo Vuelo'}</span>
                {formData.outboundFlight && (
                  <span className="text-slate-400 text-xs font-normal">➔ {formData.outboundFlight}</span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Detalles y asignación de posición en rampa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-950/80 border border-red-700 text-red-200 text-xs px-3 py-2 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vuelos & Aerolínea */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Vuelo Llegada (IN) *
                <span className="text-[10px] text-slate-400 font-normal ml-1">(Escribe con '/' ej: 6207/1732)</span>
              </label>
              <input
                type="text"
                required
                value={formData.inboundFlight || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  if (val.includes('/')) {
                    const parts = val.split('/');
                    setFormData({
                      ...formData,
                      inboundFlight: parts[0].trim(),
                      outboundFlight: parts[1].trim()
                    });
                  } else {
                    setFormData({ ...formData, inboundFlight: val });
                  }
                }}
                placeholder="Ej. DM6207"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Vuelo Salida (OUT)</label>
              <input
                type="text"
                value={formData.outboundFlight || ''}
                onChange={(e) => setFormData({ ...formData, outboundFlight: e.target.value.toUpperCase() })}
                placeholder="Ej. DM1732"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cód. Aerolínea</label>
              <input
                type="text"
                maxLength={3}
                value={formData.airlineCode || ''}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  const isArajet = code === 'DM' || code === 'DWI';
                  setFormData({
                    ...formData,
                    airlineCode: code,
                    airlineName: isArajet ? 'Arajet' : formData.airlineName,
                    aircraftType: isArajet ? '737MAX' : formData.aircraftType
                  });
                }}
                placeholder="Ej. DM"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Stand Asignado & Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Stand Asignado *</span>
              </label>
              <select
                value={formData.standId || 'UNASSIGNED'}
                onChange={(e) => setFormData({ ...formData, standId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                {stands.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.maxAircraftSize.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Estado Operativo</label>
              <select
                value={formData.status || 'SCHEDULED'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FlightStatus })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="SCHEDULED">Programado (Scheduled)</option>
                <option value="ON_BLOCK">En Bloque / Aparcado (On-Block)</option>
                <option value="DELAYED">Demorado (Delayed)</option>
                <option value="DEPARTED">Salido (Departed)</option>
              </select>
            </div>
          </div>

          {/* Horas de Llegada y Salida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Llegada Programada (STA) *</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledArrival || ''}
                onChange={(e) => setFormData({ ...formData, scheduledArrival: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Salida Programada (STD) *</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledDeparture || ''}
                onChange={(e) => setFormData({ ...formData, scheduledDeparture: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Aeronave, Matrícula y Rutas */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tipo Avión</label>
              <input
                type="text"
                value={formData.aircraftType || ''}
                onChange={(e) => setFormData({ ...formData, aircraftType: e.target.value.toUpperCase() })}
                placeholder="A320"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Matrícula (Reg)</label>
              <input
                type="text"
                value={formData.registration || ''}
                onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                placeholder="EC-MOU"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Origen (IATA)</label>
              <input
                type="text"
                maxLength={4}
                value={formData.origin || ''}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
                placeholder="MAD"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Destino (IATA)</label>
              <input
                type="text"
                maxLength={4}
                value={formData.destination || ''}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
                placeholder="BCN"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notas y Observaciones */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Observaciones Operativas</label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instrucciones de rampa, catering, combustible..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Seguro que deseas eliminar el vuelo ${formData.inboundFlight}?`)) {
                  onDelete(flight.id);
                  onClose();
                }
              }}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/60 text-xs px-3 py-1.5 rounded-lg border border-red-800/60 flex items-center space-x-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Vuelo</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-1.5 rounded-lg flex items-center space-x-1.5 shadow transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
