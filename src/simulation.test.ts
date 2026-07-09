import { describe, expect, it } from 'vitest';
import { runSimulation, simulateRun } from './simulation';

describe('deterministic balance simulation', () => {
  it('replays a seed exactly', () => expect(simulateRun(77)).toEqual(simulateRun(77)));
  it('has deterministic complete-run victory and defeat fixtures', () => { expect(simulateRun(4)).toMatchObject({ won: true, tableReached: 8 }); expect(simulateRun(1)).toMatchObject({ won: false }); });
  it('runs the configured baseline population', () => { const report = runSimulation(1000); console.log(`SIMULATION runs=${report.runs} victories=${report.victories} rate=${(report.victoryRate * 100).toFixed(1)}% reaches=${report.reaches.join('/')} median=${report.medianTotal} p90=${report.p90Total} avgHands=${report.averageHands.toFixed(1)} fixtures=win:${report.results.find(r => r.won)?.seed},loss:${report.results.find(r => !r.won)?.seed}`); expect(report.runs).toBe(1000); expect(report.victoryRate).toBeGreaterThan(0); expect(report.victoryRate).toBeLessThan(1); });
});
