import * as path from 'path';
import * as fs from 'fs';

// ARA Compliance: load environment variables securely
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import standsRouter from './routes/stands';
import flightsRouter from './routes/flights';
import uploadRouter from './routes/upload';
import syncRouter from './routes/sync';
import { db } from './db/database';
import { RedashService } from './services/redashService';

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.use('/api/stands', standsRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/sync', syncRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    app: 'Horus Stand Allocation Engine',
    timestamp: new Date().toISOString()
  });
});

// Servir horus_app.html directamente
app.get(['/horus_app.html', '/standalone'], (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, '../../horus_app.html'));
});

// Servir frontend compilado en producción si existe
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 HORUS STAND ALLOCATION ENGINE - SERVIDOR ACTIVO`);
  console.log(`📡 URL API: http://localhost:${PORT}`);
  console.log(`✈️ Visualizador: http://localhost:${PORT}`);
  console.log(`🔄 Sincronización Redash PUJ: /api/sync/redash (Terminal B)`);
  console.log(`======================================================\n`);

  // Iniciar servicio de sincronización automática en background
  const redashService = RedashService.getInstance(db);
  redashService.startAutoSync();
});
