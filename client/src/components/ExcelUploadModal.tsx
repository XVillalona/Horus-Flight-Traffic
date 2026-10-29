import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  onDownloadTemplate: () => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onDownloadTemplate
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upsert' | 'replace'>('upsert');
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    importedCount?: number;
    conflictsDetected?: number;
    parsingErrors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls') || dropped.name.endsWith('.csv')) {
        setFile(dropped);
        setResult(null);
      } else {
        alert('Por favor selecciona un archivo con extensión .xlsx, .xls o .csv');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/upload?mode=${mode}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({
          success: true,
          message: data.message,
          importedCount: data.importedCount,
          conflictsDetected: data.conflictsDetected,
          parsingErrors: data.parsingErrors
        });
        onUploadSuccess();
      } else {
        setResult({
          success: false,
          message: data.error?.message || data.message || 'Error al procesar el archivo.',
          parsingErrors: data.errors
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: `Error de red al conectar con el servidor: ${err.message}`
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Subir Asignación de Aeropuerto</h2>
              <p className="text-xs text-slate-400">Carga programación diaria o semanal en Excel o CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Plantilla info */}
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 flex items-center justify-between text-xs text-blue-200">
            <div>
              <span className="font-semibold block">¿No tienes el formato oficial de Punta Cana (PUJ)?</span>
              <span className="text-slate-400">Descarga la plantilla con stands B20-B37, N1-N13 y Remotas P1-P11 (Arajet 737MAX).</span>
            </div>
            <button
              onClick={onDownloadTemplate}
              className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1.5 rounded flex items-center space-x-1 transition font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Plantilla</span>
            </button>
          </div>

          {/* Modo de importación */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">Modo de Ingesta</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer flex flex-col transition ${
                  mode === 'upsert'
                    ? 'border-blue-500 bg-blue-950/40 text-blue-200'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <input
                    type="radio"
                    name="mode"
                    value="upsert"
                    checked={mode === 'upsert'}
                    onChange={() => setMode('upsert')}
                    className="text-blue-500"
                  />
                  <span>Actualizar / Añadir</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Combina con los vuelos existentes sin borrarlos
                </span>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer flex flex-col transition ${
                  mode === 'replace'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                    : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold">
                  <input
                    type="radio"
                    name="mode"
                    value="replace"
                    checked={mode === 'replace'}
                    onChange={() => setMode('replace')}
                    className="text-amber-500"
                  />
                  <span>Reemplazar Todo</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1">
                  Borra la programación actual y carga la nueva
                </span>
              </label>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              file
                ? 'border-emerald-500/80 bg-emerald-950/20'
                : 'border-slate-700 hover:border-blue-500 bg-slate-800/40 hover:bg-slate-800/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-slate-800 rounded-full text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              {file ? (
                <div>
                  <p className="font-semibold text-sm text-emerald-300">{file.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB • Haz clic para cambiar de archivo
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-xs text-white">
                    Arrastra aquí tu archivo Excel o haz clic para examinar
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Formatos compatibles: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de resultado */}
          {result && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                result.success
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                  : 'bg-red-950/80 border-red-700 text-red-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
                <span>{result.message}</span>
              </div>
              {result.conflictsDetected !== undefined && result.conflictsDetected > 0 && (
                <p className="mt-1 text-amber-300 font-medium">
                  ⚠️ Atención: Se han detectado {result.conflictsDetected} solapamiento(s) de stands.
                </p>
              )}
              {result.parsingErrors && result.parsingErrors.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-300 max-h-24 overflow-y-auto">
                  <p className="font-semibold text-red-300">Observaciones en filas:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {result.parsingErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={!file || isUploading}
              onClick={handleUpload}
              className={`bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow transition ${
                !file || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Procesar Asignación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
