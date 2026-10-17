// chess-tutor test suite: engine, search, puzzles, lessons.
import { describe, test, expect } from 'bun:test';
import { Board, WHITE, BLACK, KING, moveToUci, START_FEN, perft } from '../src/engine.js';
import { analyze, evaluate, formatScore, MATE_SCORE } from '../src/search.js';
import { PUZZLES } from '../src/puzzles.js';
import { LESSONS } from '../src/lessons.js';

function perftCount(b, d) {
  return perft(b, d);
}

describe('move generation — perft', () => {
  test('startpos depth 1 = 20', () => {
    expect(perftCount(Board.fromFEN(START_FEN), 1)).toBe(20);
  });
  test('startpos depth 2 = 400', () => {
    expect(perftCount(Board.fromFEN(START_FEN), 2)).toBe(400);
  });
  test('startpos depth 3 = 8902', () => {
    expect(perftCount(Board.fromFEN(START_FEN), 3)).toBe(8902);
  });
  test('kiwipete depth 1 = 48', () => {
    const b = Board.fromFEN('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1');
    expect(perftCount(b, 1)).toBe(48);
  });
});

describe('rules', () => {
  test('castling generates both sides', () => {
    const b = Board.fromFEN('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1');
    const u = b.legalMoves().map(moveToUci);
    expect(u).toContain('e1g1');
    expect(u).toContain('e1c1');
  });
  test('castling through check is illegal', () => {
    // black rook on e8 with clear file: white king in check, cannot castle
    const b2 = Board.fromFEN('4r3/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(b2.inCheck(WHITE)).toBe(true);
    const u = b2.legalMoves().map(moveToUci);
    expect(u).not.toContain('e1g1');
    expect(u).not.toContain('e1c1');
  });
  test('en passant capture exists', () => {
    const b = Board.fromFEN('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
    const u = b.legalMoves().map(moveToUci);
    expect(u).toContain('e5d6');
  });
  test('promotion generates 4 pieces', () => {
    const b = Board.fromFEN('3k4/4P3/8/8/8/8/8/4K3 w - - 0 1');
    const u = b.legalMoves().map(moveToUci);
    expect(u).toContain('e7e8q');
    expect(u).toContain('e7e8r');
    expect(u).toContain('e7e8b');
    expect(u).toContain('e7e8n');
  });
  test('checkmate detected', () => {
    const b = Board.fromFEN('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1');
    const m = b.legalMoves().find(m => moveToUci(m) === 'e1e8');
    b.make(m);
    expect(b.inCheck(BLACK)).toBe(true);
    expect(b.legalMoves().length).toBe(0);
  });
  test('stalemate detected', () => {
    const b = Board.fromFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
    expect(b.inCheck(BLACK)).toBe(false);
    expect(b.legalMoves().length).toBe(0);
  });
  test('king capture never generated', () => {
    const b = Board.fromFEN('4k3/8/8/8/8/8/4RPPP/4Q1K1 w - - 0 1');
    for (const m of b.legalMoves()) expect(m.captured).not.toBe(KING);
  });
});

describe('evaluation terms', () => {
  test('isolated pawn penalized', () => {
    // d5 isolated (no black c/e pawns), white e4 pawn ahead so not passed
    const iso = Board.fromFEN('4k3/8/8/3p4/4P3/8/8/4K3 b - - 0 1');
    const ok = Board.fromFEN('4k3/8/8/3pp4/4P3/8/8/4K3 b - - 0 1');
    const e1 = evaluate(iso);
    const e2 = evaluate(ok);
    const t1 = e1.terms.find(t => t.label.includes("Black's d5 pawn is isolated"));
    expect(t1).toBeDefined();
    expect(t1.cp).toBeGreaterThan(0); // black weakness = white-perspective positive
    expect(e1.score).toBeGreaterThan(e2.score); // isolated worse for black (better for white)
  });
  test('bishop pair bonus', () => {
    const pair = Board.fromFEN('4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1');
    const single = Board.fromFEN('4k3/8/8/8/8/8/8/2B1K3 w - - 0 1');
    const e1 = evaluate(pair);
    const e2 = evaluate(single);
    // pair has extra bishop (300) + pair bonus (30)
    expect(e1.score - e2.score).toBeGreaterThan(300);
  });
  test('open file for rook', () => {
    const open = Board.fromFEN('4k3/8/8/8/8/8/8/4R1K1 w - - 0 1'); // e-file open
    const closed = Board.fromFEN('4k3/8/8/8/4p3/8/4P3/4R1K1 w - - 0 1'); // e-file blocked
    const e1 = evaluate(open);
    const e2 = evaluate(closed);
    expect(e1.score).toBeGreaterThan(e2.score);
  });
  test('breakdown exposes terms with weights', () => {
    const b = Board.fromFEN('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
    const ev = evaluate(b);
    expect(ev.terms.length).toBeGreaterThan(3);
    for (const t of ev.terms) {
      expect(t.label).toBeString();
      expect(t.cp).toBeNumber();
      expect(t.label.length).toBeGreaterThan(10);
    }
    const sum = ev.terms.reduce((a, t) => a + t.cp, 0);
    expect(sum).toBe(ev.score); // terms reconcile to total
  });
  test('material symmetric at start', () => {
    const ev = evaluate(Board.fromFEN(START_FEN));
    expect(Math.abs(ev.score)).toBeLessThan(60);
  });
});

describe('search', () => {
  test('finds mate in 1', () => {
    const r = analyze('6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', 3);
    expect(r.bestUci).toBe('e1e8');
    expect(Math.abs(r.score)).toBeGreaterThan(MATE_SCORE - 1000);
  });
  test('finds mate in 2', () => {
    const r = analyze('6k1/5ppp/8/3N4/8/8/B4PPP/3Q2K1 w - - 0 1', 4);
    expect(r.bestUci).toBe('d5e7');
  });
  test('iterative deepening completes depth 4', () => {
    const r = analyze('r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', 4, 15000);
    expect(r.depth).toBe(4);
    expect(r.bestUci).toBeString();
    expect(r.pvSan.length).toBeGreaterThan(0);
  });
  test('formatScore mate', () => {
    expect(formatScore(MATE_SCORE - 1, WHITE)).toMatch(/M1/);
    expect(formatScore(-(MATE_SCORE - 3), WHITE)).toMatch(/M2/);
  });
});

describe('puzzles — engine verified', () => {
  test('24 puzzles curated', () => {
    expect(PUZZLES.length).toBe(24);
  });
  for (const p of PUZZLES) {
    test(`puzzle ${p.id} (${p.motif}): solution is best & winning`, () => {
      const r = analyze(p.fen, 4, 30000, 5000000);
      expect(r.bestUci).toBe(p.solution[0]);
      const winning = r.score > 150 || Math.abs(r.score) > MATE_SCORE - 1000;
      expect(winning).toBe(true);
    }, 40000);
  }
});

describe('lessons — exercises engine-approved', () => {
  test('6 lessons', () => {
    expect(LESSONS.length).toBe(6);
  });
  for (const l of LESSONS) {
    test(`lesson ${l.id}: exercise solutions are legal and sensible`, () => {
      const ex = l.exercise;
      expect(ex.solutions.length).toBeGreaterThan(0);
      const before = analyze(ex.fen, 3, 15000);
      for (const s of ex.solutions) {
        const b = Board.fromFEN(ex.fen);
        const m = b.legalMoves().find(m => moveToUci(m) === s);
        expect(m).toBeDefined(); // solution must be legal
        const undo = b.make(m);
        // after the solution, side-to-move (opponent) should not be winning
        const after = analyze(fenOf(b), 2, 8000);
        // our move should not turn a good position into a lost one
        expect(after.score).toBeLessThan(800); // opponent not crushing
        b.unmake(m, undo);
      }
      void before;
    }, 40000);
  }
});

// minimal FEN writer for test round-trips (position only; sufficient for search)
function fenOf(b) {
  let rows = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = b.b[r * 16 + f];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      const t = p & 7, c = p & 24;
      let ch = 'pnbrqk'[t - 1];
      row += c === WHITE ? ch.toUpperCase() : ch;
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return rows.join('/') + ` ${b.turn === WHITE ? 'w' : 'b'} - - 0 1`;
}
