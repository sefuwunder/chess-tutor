// chess-tutor search: alpha-beta + quiescence, positional eval with
// human-readable term breakdown. ESM — shared by tests, worker, browser.

import {
  WHITE, BLACK, EMPTY, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING,
  opp, onBoard, sqName, pieceColor, pieceType, moveToUci, Board,
} from './engine.js';

export const MATE_SCORE = 100000;
const INF = 1000000;

const VAL = { [PAWN]: 100, [KNIGHT]: 320, [BISHOP]: 330, [ROOK]: 500, [QUEEN]: 900, [KING]: 0 };

// Simplified evaluation piece-square tables (white perspective, rank 1 first).
const PST = {
  [PAWN]: [
    0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10,
    5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5,
    5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  [KNIGHT]: [
    -50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40,
    -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30,
    -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  [BISHOP]: [
    -20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10,
    -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10,
    -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  [ROOK]: [
    0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5,
    -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  [QUEEN]: [
    -20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10,
    -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10,
    -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  [KING]: [
    -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10,
    20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
  KING_EG: [
    -50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30,
    -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30,
    -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30,
    -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50],
};

function pstVal(type, sq, color, endgame) {
  const idx = (sq >> 4) * 8 + (sq & 7);
  if (type === KING && endgame) {
    const t = PST.KING_EG;
    return color === WHITE ? t[idx] : t[(7 - (sq >> 4)) * 8 + (sq & 7)];
  }
  const t = PST[type];
  return color === WHITE ? t[idx] : t[(7 - (sq >> 4)) * 8 + (sq & 7)];
}

// ---------------- evaluation ----------------
// Returns { score, terms } — score in centipawns, White perspective.
// terms: [{ label, cp (white perspective), side: 'w'|'b'|null }]

export function evaluate(board) {
  const b = board.b;
  const terms = [];
  let score = 0;

  // endgame detection: no queens -> king centralizes
  let queens = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (!onBoard(sq)) continue;
    if (b[sq] && pieceType(b[sq]) === QUEEN) queens++;
  }
  const endgame = queens === 0;

  let material = 0, placement = 0;
  const pawns = { [WHITE]: [], [BLACK]: [] };
  const pieces = { [WHITE]: [], [BLACK]: [] }; // {type, sq}
  for (let sq = 0; sq < 128; sq++) {
    if (!onBoard(sq)) continue;
    const p = b[sq];
    if (!p) continue;
    const c = pieceColor(p), t = pieceType(p);
    const v = VAL[t];
    material += c === WHITE ? v : -v;
    const pv = pstVal(t, sq, c, endgame);
    placement += c === WHITE ? pv : -pv;
    if (t === PAWN) pawns[c].push(sq);
    else pieces[c].push({ type: t, sq });
  }
  score += material + placement;

  const sideName = (c) => (c === WHITE ? 'White' : 'Black');
  const fmt = (cp) => (cp >= 0 ? '+' : '−') + (Math.abs(cp) / 100).toFixed(1).replace('-', '−');

  if (material !== 0) {
    const leader = material > 0 ? WHITE : BLACK;
    terms.push({
      label: `${sideName(leader)} is up ${describeMaterial(Math.abs(material))} (${fmt(material)})`,
      cp: material, side: leader === WHITE ? 'w' : 'b',
    });
  }
  if (placement !== 0) {
    terms.push({
      label: `${placement > 0 ? 'White' : 'Black'} has the better-placed pieces (${fmt(placement)})`,
      cp: placement, side: placement > 0 ? 'w' : 'b',
    });
  }

  // ---- pawn structure ----
  const PASSED_BONUS = [0, 8, 14, 24, 40, 70, 120, 0];
  for (const color of [WHITE, BLACK]) {
    const mine = pawns[color], foe = pawns[opp(color)];
    const files = new Array(8).fill(0);
    for (const sq of mine) files[sq & 7]++;
    const foeFiles = new Array(8).fill(0);
    for (const sq of foe) foeFiles[sq & 7]++;

    let islands = 0, inIsland = false;
    for (let f = 0; f < 8; f++) {
      if (files[f]) { if (!inIsland) { islands++; inIsland = true; } }
      else inIsland = false;
    }
    if (islands > 1 && mine.length) {
      const cp = -(islands - 1) * 8 * (color === WHITE ? 1 : -1);
      terms.push({ label: `${sideName(color)}'s pawns are split into ${islands} islands (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
      score += cp;
    }

    for (const sq of mine) {
      const f = sq & 7, r = sq >> 4;
      const name = sqName(sq);
      const isolated = (f === 0 || !files[f - 1]) && (f === 7 || !files[f + 1]);
      if (isolated) {
        const cp = -14 * (color === WHITE ? 1 : -1);
        terms.push({ label: `${sideName(color)}'s ${name} pawn is isolated and weak (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
      }
      if (files[f] > 1) {
        const cp = -10 * (color === WHITE ? 1 : -1);
        terms.push({ label: `${sideName(color)} has doubled pawns on the ${'abcdefgh'[f]}-file (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
        files[f] = 1; // report once per file
      }
      // passed pawn?
      let passed = true;
      for (let ff = Math.max(0, f - 1); ff <= Math.min(7, f + 1); ff++) {
        if (!foeFiles[ff]) continue;
        for (const esq of foe) {
          const er = esq >> 4;
          if ((esq & 7) === ff && (color === WHITE ? er > r : er < r)) { passed = false; break; }
        }
        if (!passed) break;
      }
      if (passed && mine.length) {
        const bonus = PASSED_BONUS[color === WHITE ? r : 7 - r];
        const cp = bonus * (color === WHITE ? 1 : -1);
        terms.push({ label: `${sideName(color)}'s ${name} pawn is passed and dangerous (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
      }
    }
  }

  // ---- piece activity (mobility) as one net term, plus bishops/rooks/knights ----
  const mobWeight = 2;
  let mobNet = 0;
  for (const color of [WHITE, BLACK]) {
    const s = color === WHITE ? 1 : -1;
    let mob = 0;
    let bishops = 0;
    for (const { type, sq } of pieces[color]) {
      if (type === BISHOP) bishops++;
      if (type === KING || type === PAWN) continue;
      mob += countMoves(board, sq, type, color);
    }
    mobNet += mob * mobWeight * s;
    if (bishops >= 2) {
      const cp = 3 * 10 * s; // +0.3
      terms.push({ label: `${sideName(color)} has the bishop pair (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
      score += cp;
    }
    // rooks: open / semi-open files, 7th rank
    for (const { type, sq } of pieces[color]) {
      if (type !== ROOK) continue;
      const f = sq & 7, r = sq >> 4;
      let ownPawn = false, anyPawn = false;
      for (let rr = 0; rr < 8; rr++) {
        const p = b[rr * 16 + f];
        if (p && pieceType(p) === PAWN) {
          anyPawn = true;
          if (pieceColor(p) === color) ownPawn = true;
        }
      }
      if (!anyPawn) {
        const cp = 25 * s;
        terms.push({ label: `${sideName(color)}'s rook on ${sqName(sq)} owns the open ${'abcdefgh'[f]}-file (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
      } else if (!ownPawn) {
        const cp = 12 * s;
        terms.push({ label: `${sideName(color)}'s rook on ${sqName(sq)} eyes the semi-open ${'abcdefgh'[f]}-file (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
      }
      const seventh = color === WHITE ? 6 : 1;
      if (r === seventh) {
        const cp = 20 * s;
        terms.push({ label: `${sideName(color)}'s rook has invaded the 7th rank (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
        score += cp;
      }
    }
    // knight outposts
    for (const { type, sq } of pieces[color]) {
      if (type !== KNIGHT) continue;
      const f = sq & 7, r = sq >> 4;
      const or1 = color === WHITE ? 3 : 2, or2 = color === WHITE ? 5 : 4; // ranks 4-6 / 3-5
      if (r >= or1 && r <= or2 && f >= 2 && f <= 5) {
        // defended by own pawn?
        const dr = color === WHITE ? r - 1 : r + 1;
        let defended = false;
        for (const df of [f - 1, f + 1]) {
          if (df < 0 || df > 7 || dr < 0 || dr > 7) continue;
          if (b[dr * 16 + df] === (PAWN | color)) defended = true;
        }
        // can an enemy pawn chase it?
        const er = color === WHITE ? r + 1 : r - 1;
        let chased = false;
        for (const df of [f - 1, f + 1]) {
          if (df < 0 || df > 7 || er < 0 || er > 7) continue;
          if (b[er * 16 + df] === (PAWN | opp(color))) chased = true;
        }
        if (defended && !chased) {
          const cp = 25 * s;
          terms.push({ label: `${sideName(color)}'s knight on ${sqName(sq)} sits on an outpost no pawn can challenge (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
          score += cp;
        }
      }
    }
    if (mobNet) { /* applied once after the loop */ }
  }
  if (mobNet) {
    const cp = Math.round(mobNet);
    const leader = cp > 0 ? 'White' : 'Black';
    terms.push({ label: `${leader} leads in piece activity (${fmt(cp)})`, cp, side: cp > 0 ? 'w' : 'b' });
    score += cp;
  }

  // ---- king safety ----
  for (const color of [WHITE, BLACK]) {
    const s = color === WHITE ? 1 : -1;
    const ks = board.kingSq[color];
    if (ks < 0) continue;
    const kf = ks & 7, kr = ks >> 4;
    const ahead = color === WHITE ? kr + 1 : kr - 1;
    let shield = 0, missing = 0;
    if (ahead >= 0 && ahead <= 7) {
      for (let f = kf - 1; f <= kf + 1; f++) {
        if (f < 0 || f > 7) continue;
        const p = b[ahead * 16 + f];
        if (p === (PAWN | color)) shield++;
        else if (!p) missing++;
      }
    }
    if (missing > 0 && (kr === (color === WHITE ? 0 : 7) || kr === (color === WHITE ? 1 : 6))) {
      const cp = -14 * missing * s;
      terms.push({ label: `${sideName(color)}'s king has a thin pawn shield (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
      score += cp;
    }
    // open files near the king
    let openNear = 0;
    for (let f = Math.max(0, kf - 1); f <= Math.min(7, kf + 1); f++) {
      let anyPawn = false;
      for (let r = 0; r < 8; r++) {
        const p = b[r * 16 + f];
        if (p && pieceType(p) === PAWN) { anyPawn = true; break; }
      }
      if (!anyPawn) openNear++;
    }
    if (openNear > 0 && (kr === (color === WHITE ? 0 : 7))) {
      const cp = -12 * openNear * s;
      terms.push({ label: `${sideName(color)}'s king faces ${openNear} open file${openNear > 1 ? 's' : ''} nearby (${fmt(cp)})`, cp, side: color === WHITE ? 'w' : 'b' });
      score += cp;
    }
  }

  terms.sort((a, b2) => Math.abs(b2.cp) - Math.abs(a.cp));
  return { score: Math.round(score), terms };
}

function describeMaterial(cp) {
  const v = Math.round(cp / 100);
  const names = { 1: 'a pawn', 3: 'a piece', 5: 'a rook', 9: 'a queen' };
  for (const k of [9, 5, 3, 1]) if (v >= k) return names[k];
  return `${v} pawns`;
}

// pseudo-legal move count for one piece (mobility)
const SLIDE_OFF = { [BISHOP]: [15, 17, -15, -17], [ROOK]: [16, -16, 1, -1], [QUEEN]: [15, 16, 17, 1, -1, -15, -16, -17] };
const JUMP_OFF = { [KNIGHT]: [14, 18, 31, 33, -14, -18, -31, -33] };
function countMoves(board, sq, type, color) {
  const b = board.b;
  let n = 0;
  if (JUMP_OFF[type]) {
    for (const o of JUMP_OFF[type]) {
      const to = sq + o;
      if (!onBoard(to)) continue;
      const p = b[to];
      if (!p || pieceColor(p) !== color) n++;
    }
  } else {
    for (const o of SLIDE_OFF[type]) {
      let to = sq + o;
      while (onBoard(to)) {
        const p = b[to];
        if (!p) n++;
        else { if (pieceColor(p) !== color) n++; break; }
        to += o;
      }
    }
  }
  return n;
}

// ---------------- search ----------------

function orderMoves(board, moves, killers) {
  for (const m of moves) {
    let s = 0;
    if (m.captured) s = 10 * VAL[m.captured] - VAL[pieceType(m.piece)] + 10000;
    if (m.promo) s += 9000 + VAL[m.promo];
    if (killers && (killers[0] === m || killers[1] === m)) s += 500;
    m._s = s;
  }
  moves.sort((a, b2) => b2._s - a._s);
  return moves;
}

class Searcher {
  constructor(maxMs, maxNodes) {
    this.maxMs = maxMs;
    this.maxNodes = maxNodes || Infinity;
    this.nodes = 0;
    this.stop = false;
    this.killers = new Map();
    this.start = Date.now();
  }
  checkTime() {
    if ((this.nodes & 2047) === 0) {
      if (Date.now() - this.start > this.maxMs || this.nodes > this.maxNodes) this.stop = true;
    }
  }

  quiesce(board, alpha, beta, ply) {
    this.nodes++;
    this.checkTime();
    if (this.stop) return 0;
    // In check: must search all legal evasions (and detect mate/stalemate).
    if (board.inCheck(board.turn)) {
      const moves = orderMoves(board, board.legalMoves());
      if (moves.length === 0) return -(MATE_SCORE - ply);
      for (const m of moves) {
        const undo = board.make(m);
        const score = -this.quiesce(board, -beta, -alpha, ply + 1);
        board.unmake(m, undo);
        if (this.stop) return 0;
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    }
    const stand = this.evalSide(board);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    const moves = orderMoves(board, board.pseudoMoves().filter(m => m.captured || m.promo));
    for (const m of moves) {
      const undo = board.make(m);
      let score;
      if (board.inCheck(opp(board.turn))) { board.unmake(m, undo); continue; }
      score = -this.quiesce(board, -beta, -alpha, ply + 1);
      board.unmake(m, undo);
      if (this.stop) return 0;
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  evalSide(board) {
    const e = evaluate(board).score;
    return board.turn === WHITE ? e : -e;
  }

  alphabeta(board, depth, alpha, beta, ply) {
    this.nodes++;
    this.checkTime();
    if (this.stop) return 0;
    if (board.half >= 100) return 0;
    const moves = board.legalMoves();
    if (moves.length === 0) {
      return board.inCheck(board.turn) ? -(MATE_SCORE - ply) : 0;
    }
    if (depth <= 0) return this.quiesce(board, alpha, beta, ply);
    const killers = this.killers.get(ply) || [];
    orderMoves(board, moves, killers);
    let best = null;
    for (const m of moves) {
      const undo = board.make(m);
      const score = -this.alphabeta(board, depth - 1, -beta, -alpha, ply + 1);
      board.unmake(m, undo);
      if (this.stop) return 0;
      if (score >= beta) {
        if (!m.captured) {
          const k = this.killers.get(ply) || [];
          if (k[0] !== m) { k[1] = k[0]; k[0] = m; this.killers.set(ply, k); }
        }
        return beta;
      }
      if (score > alpha) { alpha = score; best = m; }
    }
    return alpha;
  }

  // root search with PV
  root(board, depth) {
    const moves = board.legalMoves();
    if (moves.length === 0) {
      return { move: null, score: board.inCheck(board.turn) ? -MATE_SCORE : 0, pv: [], nodes: this.nodes };
    }
    orderMoves(board, moves, this.killers.get(0) || []);
    let alpha = -INF, best = moves[0], pv = [moves[0]];
    for (const m of moves) {
      const undo = board.make(m);
      const score = -this.alphabeta(board, depth - 1, -INF, -alpha, 1);
      board.unmake(m, undo);
      if (this.stop) break;
      if (score > alpha) {
        alpha = score; best = m;
        pv = [m, ...this.collectPv(board, m, depth)];
      }
    }
    return { move: best, score: alpha, pv, nodes: this.nodes };
  }

  collectPv(board, m, depth) {
    // shallow PV: best reply at depth-1 via quick search is expensive;
    // walk the killer/best-guess: just re-search one ply for display.
    if (depth <= 1) return [];
    const undo = board.make(m);
    const moves = board.legalMoves();
    let out = [];
    if (moves.length) {
      orderMoves(board, moves, this.killers.get(1) || []);
      let alpha = -INF, bm = moves[0];
      for (const mm of moves) {
        const u2 = board.make(mm);
        const s = -this.alphabeta(board, depth - 2, -INF, -alpha, 2);
        board.unmake(mm, u2);
        if (this.stop) break;
        if (s > alpha) { alpha = s; bm = mm; }
      }
      out = [bm];
    }
    board.unmake(m, undo);
    return out;
  }
}

export function formatScore(score, side) {
  // side: color to move perspective -> display from White perspective string
  const white = side === WHITE ? score : -score;
  if (Math.abs(white) > MATE_SCORE - 1000) {
    const n = Math.ceil((MATE_SCORE - Math.abs(white)) / 2);
    return (white > 0 ? 'M' : '-M') + n;
  }
  const v = white / 100;
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

// Analyze: iterative deepening to `depth`. Returns best move (side-to-move
// perspective score), PV in UCI, eval breakdown of the root position.
export function analyze(fen, depth = 3, maxMs = 2500, maxNodes = 2000000) {
  const board = Board.fromFEN(fen);
  const s = new Searcher(maxMs, maxNodes);
  let result = null;
  for (let d = 1; d <= depth; d++) {
    const r = s.root(board, d);
    if (s.stop) break;
    result = r;
    if (Math.abs(r.score) > MATE_SCORE - 1000) break;
  }
  if (!result) result = s.root(board, 1);
  const ev = evaluate(board);
  // walk the PV to get correct SAN (each move in its own position)
  const pvSan = [];
  const undos = [];
  for (const m of result.pv) {
    pvSan.push(board.toSan(m));
    undos.push(board.make(m));
  }
  for (let i = undos.length - 1; i >= 0; i--) board.unmake(result.pv[i], undos[i]);
  return {
    bestUci: result.move ? moveToUci(result.move) : null,
    bestSan: result.move ? board.toSan(result.move) : null,
    score: result.score, // side-to-move perspective
    scoreWhite: board.turn === WHITE ? result.score : -result.score,
    pv: result.pv.map(moveToUci),
    pvSan,
    nodes: result.nodes,
    depth,
    evalTerms: ev.terms,
    evalWhite: ev.score,
    turn: board.turn,
  };
}

export function engineMove(fen, depth = 3, maxMs = 2500) {
  return analyze(fen, depth, maxMs).bestUci;
}
