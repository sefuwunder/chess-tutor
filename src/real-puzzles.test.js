// Real-game puzzles: every position must be sane, every solution
// engine-best and winning (the curated bar), and every attribution must be
// TRUE — verified by replaying the source classics game to the puzzle ply
// and comparing FEN and solution move, not by trusting the stored fields.
import { describe, test, expect } from 'bun:test';
import { Board, START_FEN, moveToUci } from '../src/engine.js';
import { analyze, MATE_SCORE } from '../src/search.js';
import { CLASSICS } from '../src/classics.js';
import { REAL_PUZZLES } from '../src/real-puzzles.js';

describe('real-game puzzles', () => {
  test('a real set exists', () => {
    expect(REAL_PUZZLES.length).toBeGreaterThan(0);
  });

  test('every puzzle position is sane and its solution is legal', () => {
    for (const p of REAL_PUZZLES) {
      expect(Board.fromFEN(p.fen).validate(), `real puzzle ${p.id}`).toEqual([]);
      const m = Board.fromFEN(p.fen).moveFromUci(p.solution[0]);
      expect(m, `real puzzle ${p.id}: solution ${p.solution[0]} must be legal`).not.toBeNull();
      expect(['Mate', 'Back-rank mate', 'Tactic']).toContain(p.motif);
    }
  });

  test('every attribution replays to the puzzle position', () => {
    for (const p of REAL_PUZZLES) {
      const s = p.source;
      expect(s, `real puzzle ${p.id} needs a source`).toBeDefined();
      const g = CLASSICS[s.game];
      expect(g, `real puzzle ${p.id}: source game index ${s.game}`).toBeDefined();
      expect(g.white).toBe(s.white);
      expect(g.black).toBe(s.black);
      expect(g.date).toBe(s.date);
      expect(g.moves[s.ply]).toBe(p.solution[0]);
      const b = Board.fromFEN(START_FEN);
      for (let i = 0; i < s.ply; i++) {
        const m = b.legalMoves().find((x) => moveToUci(x) === g.moves[i]);
        expect(m, `replaying ${s.white} vs ${s.black} to ply ${s.ply}`).not.toBeNull();
        if (!m) break;
        b.make(m);
      }
      expect(b.toFEN()).toBe(p.fen);
      // move number matches the ply: white moves on odd move numbers
      const sideToMove = p.fen.includes(' b ') ? 'b' : 'w';
      expect(s.moveNo).toBe(Math.floor(s.ply / 2) + 1);
      expect(sideToMove).toBe(s.ply % 2 === 0 ? 'w' : 'b');
    }
  });

  test('no duplicate puzzle positions', () => {
    const seen = new Set();
    for (const p of REAL_PUZZLES) {
      expect(seen.has(p.fen), `duplicate position: ${p.title}`).toBe(false);
      seen.add(p.fen);
    }
  });

  for (const p of REAL_PUZZLES) {
    test(`real puzzle ${p.id} (${p.title}): solution is best & winning`, () => {
      const r = analyze(p.fen, 4, 30000, 5000000);
      expect(r.bestUci).toBe(p.solution[0]);
      const winning = r.score > 150 || Math.abs(r.score) > MATE_SCORE - 1000;
      expect(winning).toBe(true);
    }, 40000);
  }
});
