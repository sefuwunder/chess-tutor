import { describe, test, expect } from 'bun:test';
import { Board, START_FEN } from './engine.js';
import { CLASSICS } from './classics.js';
import { ClassicPlayer } from './classic-player.js';

// Naive replay: the old page behavior, used as ground truth for positions.
function replayFen(game, ply) {
  const b = Board.fromFEN(START_FEN);
  for (let i = 0; i < ply; i++) {
    const m = b.legalMoves().find((x) =>
      x.from === sqOf(game.moves[i].slice(0, 2)) && x.to === sqOf(game.moves[i].slice(2, 4)));
    if (!m) break;
    b.make(m);
  }
  return b.toFEN();
}
function sqOf(s) {
  return ('abcdefgh'.indexOf(s[0])) + (parseInt(s[1]) - 1) * 16;
}

function countLegalMoves(fn) {
  const orig = Board.prototype.legalMoves;
  let n = 0;
  Board.prototype.legalMoves = function (...args) { n++; return orig.apply(this, args); };
  try { fn(); } finally { Board.prototype.legalMoves = orig; }
  return n;
}

const LONG = CLASSICS[52]; // 144 plies, the longest game in the set
const SHORT = CLASSICS[0];

describe('ClassicPlayer', () => {
  test('construction replays the whole game: sans + fens line up', () => {
    const p = new ClassicPlayer(LONG);
    expect(p.length).toBe(LONG.moves.length);
    expect(p.sans.length).toBe(LONG.moves.length);
    expect(p.fens.length).toBe(LONG.moves.length + 1);
    expect(p.fens[0]).toBe(Board.fromFEN(START_FEN).toFEN());
    expect(p.fens[p.length]).toBe(replayFen(LONG, LONG.moves.length));
  });

  test('incremental stepping lands on the naive-replay position', () => {
    const p = new ClassicPlayer(LONG);
    let board = Board.fromFEN(START_FEN);
    for (const target of [1, 30, 31, 30, 144, 143, 0, 77, 78, 77]) {
      ({ board } = p.goto(board, target));
      expect(board.toFEN()).toBe(replayFen(LONG, target));
      expect(p.ply).toBe(target);
    }
  });

  test('stepping uses zero move generations after construction', () => {
    const p = new ClassicPlayer(SHORT);
    let board = Board.fromFEN(START_FEN);
    const n = countLegalMoves(() => {
      for (let i = 0; i < 20; i++) ({ board } = p.goto(board, i + 1));
      for (let i = 20; i > 0; i--) ({ board } = p.goto(board, i - 1));
    });
    expect(n).toBe(0);
  });

  test('jumps use zero move generations after construction', () => {
    const p = new ClassicPlayer(LONG);
    let board = Board.fromFEN(START_FEN);
    const n = countLegalMoves(() => {
      ({ board } = p.goto(board, 144));
      ({ board } = p.goto(board, 0));
      ({ board } = p.goto(board, 77));
    });
    expect(n).toBe(0);
    expect(board.toFEN()).toBe(replayFen(LONG, 77));
  });

  test('a foreign board takes the reset path and still lands exactly', () => {
    const p = new ClassicPlayer(LONG);
    let board = Board.fromFEN(START_FEN);
    ({ board } = p.goto(board, 40));
    // simulate a tab switch: the page board is replaced by a tactics position
    board = Board.fromFEN('8/8/8/8/8/7k/4q2P/6K1 b - - 0 1');
    ({ board } = p.goto(board, 40));
    expect(board.toFEN()).toBe(replayFen(LONG, 40));
    expect(p.ply).toBe(40);
    // and stepping continues incrementally from there
    ({ board } = p.goto(board, 41));
    expect(board.toFEN()).toBe(replayFen(LONG, 41));
  });

  test('ply clamps to [0, length]', () => {
    const p = new ClassicPlayer(SHORT);
    let board = Board.fromFEN(START_FEN);
    ({ board } = p.goto(board, -5));
    expect(p.ply).toBe(0);
    ({ board } = p.goto(board, 9999));
    expect(p.ply).toBe(SHORT.moves.length);
  });

  test('every classic game constructs and ends on its recorded result square', () => {
    // cheap smoke: all 100 games replay without a dropped move
    for (const g of CLASSICS) {
      const p = new ClassicPlayer(g);
      expect(p.length).toBe(g.moves.length);
    }
  });
});
