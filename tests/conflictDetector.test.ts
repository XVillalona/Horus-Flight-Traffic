import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ConflictDetector } from '../server/src/services/conflictDetector';
import { FlightAllocation } from '../server/src/db/schema';

describe('ConflictDetector - ARA-MAN-TIC-2008 Unit Tests', () => {
  const baseFlight: FlightAllocation = {
    id: 'F1',
    inboundFlight: 'IB3111',
    airlineCode: 'IB',
    airlineName: 'Iberia',
    aircraftType: 'A320',
    standId: 'B20',
    scheduledArrival: '2026-10-27T10:00:00.000Z',
    scheduledDeparture: '2026-10-27T11:00:00.000Z',
    status: 'SCHEDULED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('Given two overlapping flights on the same stand, When evaluated, Then detects conflict', () => {
    // Given
    const flight2: FlightAllocation = {
      ...baseFlight,
      id: 'F2',
      inboundFlight: 'AA103',
      scheduledArrival: '2026-10-27T10:30:00.000Z',
      scheduledDeparture: '2026-10-27T11:30:00.000Z'
    };

    // When
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts([baseFlight, flight2]);

    // Then
    assert.equal(conflicts.length, 1);
    assert.equal(conflicts[0].standId, 'B20');
    assert.equal(evaluatedFlights.find(f => f.id === 'F1')?.hasConflict, true);
    assert.equal(evaluatedFlights.find(f => f.id === 'F2')?.hasConflict, true);
  });

  it('Given two flights on different stands, When evaluated, Then reports zero conflicts', () => {
    // Given
    const flight2: FlightAllocation = {
      ...baseFlight,
      id: 'F2',
      standId: 'B21',
      scheduledArrival: '2026-10-27T10:30:00.000Z',
      scheduledDeparture: '2026-10-27T11:30:00.000Z'
    };

    // When
    const { conflicts } = ConflictDetector.evaluateConflicts([baseFlight, flight2]);

    // Then
    assert.equal(conflicts.length, 0);
  });

  it('Given unassigned buffer flights, When evaluated, Then no conflict is flagged', () => {
    // Given
    const flight1: FlightAllocation = {
      ...baseFlight,
      standId: 'UNASSIGNED',
      scheduledArrival: '2026-10-27T10:00:00.000Z',
      scheduledDeparture: '2026-10-27T11:00:00.000Z'
    };
    const flight2: FlightAllocation = {
      ...baseFlight,
      id: 'F2',
      standId: 'UNASSIGNED',
      scheduledArrival: '2026-10-27T10:30:00.000Z',
      scheduledDeparture: '2026-10-27T11:30:00.000Z'
    };

    // When
    const { conflicts } = ConflictDetector.evaluateConflicts([flight1, flight2]);

    // Then
    assert.equal(conflicts.length, 0);
  });

  it('Given subdivided positions B23A and B23B, When evaluated, Then treats them as independent stands', () => {
    // Given
    const flightA: FlightAllocation = {
      ...baseFlight,
      id: 'FA',
      standId: 'B23A',
      scheduledArrival: '2026-10-27T10:00:00.000Z',
      scheduledDeparture: '2026-10-27T11:00:00.000Z'
    };
    const flightB: FlightAllocation = {
      ...baseFlight,
      id: 'FB',
      standId: 'B23B',
      scheduledArrival: '2026-10-27T10:00:00.000Z',
      scheduledDeparture: '2026-10-27T11:00:00.000Z'
    };

    // When
    const { conflicts } = ConflictDetector.evaluateConflicts([flightA, flightB]);

    // Then
    assert.equal(conflicts.length, 0);
  });

  it('Given Arajet 737MAX and remote stand P flights, When evaluated, Then produces zero false positives', () => {
    // Given
    const arajetFlight: FlightAllocation = {
      ...baseFlight,
      id: 'F-ARAJET',
      inboundFlight: 'DM6207',
      outboundFlight: 'DM1732',
      airlineCode: 'DM',
      airlineName: 'Arajet',
      aircraftType: '737MAX',
      standId: 'B26',
      scheduledArrival: '2026-10-27T09:57:00.000Z',
      scheduledDeparture: '2026-10-27T11:57:00.000Z'
    };
    const remoteFlight: FlightAllocation = {
      ...baseFlight,
      id: 'F-REMOTE',
      inboundFlight: 'AC1794',
      outboundFlight: 'AC1795',
      airlineCode: 'AC',
      airlineName: 'Air Canada',
      aircraftType: 'B787-9',
      standId: 'P6',
      scheduledArrival: '2026-10-27T11:10:00.000Z',
      scheduledDeparture: '2026-10-27T12:05:00.000Z'
    };

    // When
    const { evaluatedFlights, conflicts } = ConflictDetector.evaluateConflicts([arajetFlight, remoteFlight]);

    // Then
    assert.equal(conflicts.length, 0);
    assert.equal(evaluatedFlights.find(f => f.id === 'F-ARAJET')?.aircraftType, '737MAX');
  });
});
