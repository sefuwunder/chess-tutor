// Top-100 classic games: data integrity + engine replay tests.
import { describe, test, expect } from 'bun:test';
import { Board, START_FEN } from '../src/engine.js';
import { CLASSICS } from '../src/classics.js';

describe('classic games — top 100', () => {
  test('exactly 100 games', () => {
    expect(CLASSICS.length).toBe(100);
  });

  test('every game has complete metadata and a valid result', () => {
    for (const g of CLASSICS) {
      expect(g.white.length, 'white').toBeGreaterThan(0);
      expect(g.black.length, 'black').toBeGreaterThan(0);
      expect(g.date.length, 'date').toBeGreaterThanOrEqual(4);
      expect(['1-0', '0-1', '1/2-1/2']).toContain(g.result);
      expect(g.moves.length, `${g.white} vs ${g.black}`).toBeGreaterThan(10);
    }
  });

  test('games are in chronological order', () => {
    for (let i = 1; i < CLASSICS.length; i++) {
      expect(parseInt(CLASSICS[i].date)).toBeGreaterThanOrEqual(parseInt(CLASSICS[i - 1].date));
    }
  });

  test('every game replays legally from the start position, every position sane', () => {
    for (const g of CLASSICS) {
      const b = Board.fromFEN(START_FEN);
      for (const uci of g.moves) {
        expect(b.validate(), `${g.white} vs ${g.black} before ${uci}`).toEqual([]);
        const m = b.moveFromUci(uci);
        expect(m, `${g.white} vs ${g.black}: ${uci} must be legal`).not.toBeNull();
        if (!m) break;
        b.make(m);
      }
    }
  });

  test('no two games share the same move list', () => {
    const seen = new Set();
    for (const g of CLASSICS) {
      const key = g.moves.join(' ');
      expect(seen.has(key), `duplicate game: ${g.white} vs ${g.black}`).toBe(false);
      seen.add(key);
    }
  });

  test('the unmissable games are present', () => {
    const has = (w, b) => CLASSICS.some((g) => g.white.includes(w) && g.black.includes(b));
    expect(has('Morphy', 'Duke Karl')).toBe(true); // Opera Game, 1858
    expect(has('Anderssen', 'Kieseritzky')).toBe(true); // Immortal Game, 1851
    expect(has('Anderssen', 'Dufresne')).toBe(true); // Evergreen Game, 1852
    expect(has('Byrne', 'Fischer')).toBe(true); // Game of the Century, 1956
    expect(has('Fischer', 'Spassky')).toBe(true); // 1972 match
    expect(has('Kasparov', 'Topalov')).toBe(true); // Kasparov's Immortal, 1999
    expect(has('Torre', 'Lasker')).toBe(true); // Windmill, 1925
    expect(has('Polugaevsky', 'Nezhmetdinov')).toBe(true); // Brilliancy, 1958
  });
});
