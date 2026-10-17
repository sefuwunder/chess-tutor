# Chess Tutor

A self-hosted web app for learning chess — not just a board, but a teacher. The differentiator is that it **explains**: every evaluation comes with plain-language sentences describing the positional factors behind the numbers.

## What it teaches

**Analyze mode (positional tutor)**
- Interactive board: click-to-move, legal-move dots, coordinates, flip (F), last-move and check highlights
- **Analyze button**: runs the engine and shows numeric eval, best-move arrow, and a breakdown like:
  - "White has the bishop pair (+0.3)"
  - "Black's d6 pawn is isolated and weak (−0.2)"
  - "White's rook owns the only open file"
- FEN paste/copy, new game vs engine (plays Black, depth 1–4), takeback, move list
- Arrow keys step through moves

**Tactics trainer**
- 24 curated puzzles across motifs: forks, pins, skewers, discovered attacks, double checks, back-rank mates, deflection, decoy, clearance, x-ray
- Every puzzle engine-verified: the solution is the engine's best move at depth 4 and winning
- Streak counter, score, hint button (motif + target square), retry, next; progress persists in localStorage

**Positional lessons**
- 6 guided lessons: isolated queen's pawn, outposts, open files & 7th rank, bishop pair, king safety, passed pawns
- Each lesson: 2–4 cards with board positions, ending in an engine-checked exercise

## Engine (written from scratch, no stockfish)

- 0x88 board, legal move generation (castling, en passant, promotion)
- Alpha-beta with quiescence search, MVV-LVA + killer move ordering, iterative deepening (depth 1–4)
- Evaluation: piece-square tables, pawn structure (isolated/doubled/passed, islands), mobility, rook open/semi-open files, bishop pair, king safety (pawn shield, open lines), knight outposts
- Strength: finds tactics reliably at depth 3–4; roughly club-player level — appropriate for a tutor
- Shared ESM module (`src/engine.js`, `src/search.js`) used by bun tests and the browser

## Run it

```bash
git pull
bun src/server.ts
# → http://127.0.0.1:3033
```

Bun + zero npm dependencies. Serves `public/` and `src/` (engine as ESM).

## Tests

```bash
bun test
# 52 tests: perft 20/400/8902, check/mate/stalemate, castling/ep/promotion,
# eval-term unit tests, mate-in-1/2, all 24 puzzles engine-verified,
# all 6 lesson exercises engine-approved
```

## Controls

- Click a piece, then a highlighted square (or destination) to move
- **F**: flip board · **←/→**: step through moves (analyze mode)
- Depth selector controls engine strength (1–4)

## Notes

- Pawn promotion auto-queens (choose underpromotion via FEN if needed)
- Drag-to-move not yet implemented (click-to-move only)
- The engine is deterministic and local — no network, no AI
