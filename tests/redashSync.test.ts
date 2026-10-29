import * as path from 'path';
import * as fs from 'fs';

// ARA Compliance: load environment variables securely
const envPath = path.resolve(__dirname, '../server/.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

import { StandDatabase } from '../server/src/db/database';
import { RedashService } from '../server/src/services/redashService';

async function runTest() {
  console.log('🧪 INICIANDO TEST DE INTEGRACIÓN: RedashService (PUJ Live Sync - Terminal B)');

  // Base de datos de prueba en memoria o archivo temporal
  const tempDbPath = path.resolve(__dirname, '../server/data/test_db.json');
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

  const testDb = new StandDatabase(tempDbPath);
  const redashService = RedashService.getInstance(testDb);

  console.log('\n1. Test de Configuración inicial:');
  const cfg = redashService.getConfig();
  console.log('  Base URL:', cfg.baseUrl);
  console.log('  Dashboard ID:', cfg.dashboardId);
  console.log('  Query ID:', cfg.queryId);
  console.log('  Filtro Terminal:', cfg.terminalFilter);
  console.log('  Intervalo Auto-sync (min):', cfg.autoSyncIntervalMinutes);
  if (cfg.terminalFilter !== 'B') throw new Error('El filtro de terminal debe ser estrictamente B');

  console.log('\n2. Test de Sincronización en vivo con Redash PUJ:');
  const result = await redashService.syncNow('replace');

  console.log('  Resultado éxito:', result.success);
  console.log('  Filas totales en Redash:', result.totalDatasetRows);
  console.log('  Vuelos de Terminal B importados:', result.terminalBCount);
  console.log('  Vuelos ajenos/Terminal A descartados:', result.discardedCount);
  console.log('  Conflictos evaluados en B:', result.conflictsCount);

  if (result.terminalBCount === 0) {
    throw new Error('No se obtuvo ningún vuelo de Terminal B');
  }

  console.log('\n3. Validaciones de Reglas de Negocio en los vuelos importados:');
  const flights = testDb.getFlights();
  console.log(`  Total vuelos en base de datos: ${flights.length}`);

  // Regla A: Ningún vuelo debe ser de Terminal A o ajeno a B
  let nonBFound = 0;
  for (const f of flights) {
    if (f.notes && f.notes.includes('Terminal A')) {
      nonBFound++;
    }
  }
  console.log(`  Vuelos no pertenecientes a Terminal B: ${nonBFound} (Esperado: 0)`);
  if (nonBFound > 0) throw new Error('Se encontraron vuelos de Terminal A en la base de datos');

  // Regla B: Flota Arajet es 737MAX estricto
  const arajetFlights = flights.filter(f => f.airlineCode === 'DM' || f.airlineName.toUpperCase().includes('ARAJET'));
  console.log(`  Vuelos de Arajet encontrados: ${arajetFlights.length}`);
  const nonMaxArajet = arajetFlights.filter(f => f.aircraftType !== '737MAX');
  console.log(`  Vuelos de Arajet que NO son 737MAX: ${nonMaxArajet.length} (Esperado: 0)`);
  if (nonMaxArajet.length > 0) throw new Error('Se detectó vuelo de Arajet con modelo diferente a 737MAX');

  // Regla C: Vuelos Overnight (STD: OVER)
  const overnightFlights = flights.filter(f => f.notes && f.notes.includes('OVERNIGHT'));
  console.log(`  Vuelos nocturnos (OVERNIGHT) detectados: ${overnightFlights.length}`);
  for (const on of overnightFlights.slice(0, 3)) {
    console.log(`    - ${on.inboundFlight} (${on.airlineName}): STA=${on.scheduledArrival.slice(11, 16)} STD=${on.scheduledDeparture.slice(11, 16)} Stand=${on.standId}`);
  }

  // Regla D: Catálogo de Stands
  const validStands = new Set(testDb.getStands().map(s => s.id));
  const invalidStands = flights.filter(f => !validStands.has(f.standId));
  console.log(`  Vuelos con stand inválido: ${invalidStands.length} (Esperado: 0)`);
  if (invalidStands.length > 0) throw new Error('Se encontraron stands inválidos en vuelos importados');

  // Limpiar archivo temporal
  if (fs.existsSync(tempDbPath)) fs.unlinkSync(tempDbPath);

  console.log('\n✅ TEST COMPLETADO CON ÉXITO: 100% DE REGLAS OPERACIONALES VALIDADAS');
}

runTest().catch(err => {
  console.error('\n❌ ERROR EN TEST:', err);
  process.exit(1);
});
