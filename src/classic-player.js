// ClassicPlayer: stepping through a classic game without replaying it.
//
// The old page code rebuilt every ply from scratch on each click: replay
// from move 0 (one full legal-move generation per ply) plus a full panel
// rebuild. Cost grew linearly with depth — ~5ms/click early, ~14ms/click
// near the end of a 144-ply game, and worse on slower machines.
//
// This player pays for move generation exactly once, at construction:
// it replays the game a single time, stashing the SAN, the move object,
// and the exact FEN after every ply. Stepping then costs one make/unmake
// per ply (or a run of cheap makes for a jump), and never calls
// legalMoves again. Move objects are safe to re-make on another board:
// Board.make reads from/to/promo/flags plus the live board, never trusts
// the stashed captured piece.
//
// Sync is verified, not assumed: goto() compares the caller's board FEN
// against the stashed FEN at the current ply. If the board was changed
// behind the player's back (tab switch, another mode), goto takes the
// reset path — a fresh board plus cheap makes — and lands exactly on
// target. Either path ends with board FEN === fens[target].

import { Board, START_FEN, moveToUci } from './engine.js';

export class ClassicPlayer {
  constructor(game) {
    this.game = game;
    const b = Board.fromFEN(START_FEN);
    this.sans = [];
    this.moves = []; // move objects, safe to re-make (see header)
    this.fens = [b.toFEN()];
    for (const uci of game.moves) {
      const m = b.legalMoves().find((x) => moveToUci(x) === uci);
      if (!m) break;
      this.sans.push(b.toSan(m));
      this.moves.push(m);
      b.make(m);
      this.fens.push(b.toFEN());
    }
    this.ply = 0;
    this.stack = []; // {m, undo} for plies applied to the live board
  }

  get length() { return this.moves.length; }

  // Move `board` to targetPly. Returns {board, ply} — board may be a fresh
  // instance on the reset path; the caller must adopt the returned board.
  goto(board, targetPly) {
    targetPly = Math.max(0, Math.min(this.moves.length, targetPly));
    if (board.toFEN() === this.fens[this.ply]) {
      // incremental path: the board is where we left it
      while (this.ply < targetPly) {
        const m = this.moves[this.ply];
        this.stack.push({ m, undo: board.make(m) });
        this.ply++;
      }
      while (this.ply > targetPly) {
        const { m, undo } = this.stack.pop();
        board.unmake(m, undo);
        this.ply--;
      }
      return { board, ply: this.ply };
    }
    // reset path: the board moved behind our back — rebuild cheaply
    const fresh = Board.fromFEN(START_FEN);
    this.stack = [];
    for (let i = 0; i < targetPly; i++) {
      const m = this.moves[i];
      this.stack.push({ m, undo: fresh.make(m) });
    }
    this.ply = targetPly;
    return { board: fresh, ply: this.ply };
  }
}
