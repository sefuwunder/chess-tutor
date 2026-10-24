// chess-tutor engine: 0x88 board, legal move generation, FEN, perft.
// ESM — shared by bun tests, the browser app, and the search worker.

export const WHITE = 8, BLACK = 16, EMPTY = 0;
export const PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;

export const PIECE_LETTER = { 1: 'p', 2: 'n', 3: 'b', 4: 'r', 5: 'q', 6: 'k' };
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const KNIGHT_OFF = [14, 18, 31, 33, -14, -18, -31, -33];
const KING_OFF = [15, 16, 17, 1, -1, -15, -16, -17];
const BISHOP_OFF = [15, 17, -15, -17];
const ROOK_OFF = [16, -16, 1, -1];

// castling rights bits
const CK = 1, CQ = 2, ck = 4, cq = 8;

export function opp(color) { return color === WHITE ? BLACK : WHITE; }
export function sqName(sq) { return 'abcdefgh'[sq & 7] + ((sq >> 4) + 1); }
export function sqFromName(name) {
  return (name.charCodeAt(0) - 97) + ((name.charCodeAt(1) - 49) << 4);
}
export function pieceColor(p) { return p & 24; }
export function pieceType(p) { return p & 7; }
export function onBoard(sq) { return (sq & 0x88) === 0; }

export function moveToUci(m) {
  let u = sqName(m.from) + sqName(m.to);
  if (m.promo) u += PIECE_LETTER[m.promo];
  return u;
}

// move: {from, to, piece, captured, promo, flags}
// flags: 'n' normal, 'b' double pawn push, 'e' en passant, 'k'/'q' castle,
//        'p' promotion; captured>0 implies capture.

export class Board {
  constructor() {
    this.b = new Array(128).fill(EMPTY);
    this.turn = WHITE;
    this.castling = 0;
    this.ep = -1;
    this.half = 0;
    this.full = 1;
    this.kingSq = { [WHITE]: -1, [BLACK]: -1 };
    this.undoStack = [];
  }

  clone() {
    const c = new Board();
    c.b = this.b.slice();
    c.turn = this.turn; c.castling = this.castling; c.ep = this.ep;
    c.half = this.half; c.full = this.full;
    c.kingSq = { [WHITE]: this.kingSq[WHITE], [BLACK]: this.kingSq[BLACK] };
    return c;
  }

  static fromFEN(fen) {
    const bd = new Board();
    const parts = fen.trim().split(/\s+/);
    const rows = parts[0].split('/');
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const ch of rows[7 - r]) {
        if (/\d/.test(ch)) { f += +ch; continue; }
        const color = ch === ch.toUpperCase() ? WHITE : BLACK;
        const type = { p: PAWN, n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN, k: KING }[ch.toLowerCase()];
        const sq = r * 16 + f;
        bd.b[sq] = type | color;
        if (type === KING) bd.kingSq[color] = sq;
        f++;
      }
    }
    bd.turn = parts[1] === 'b' ? BLACK : WHITE;
    bd.castling = 0;
    if (parts[2] && parts[2] !== '-') {
      for (const ch of parts[2]) {
        if (ch === 'K') bd.castling |= CK;
        else if (ch === 'Q') bd.castling |= CQ;
        else if (ch === 'k') bd.castling |= ck;
        else if (ch === 'q') bd.castling |= cq;
      }
    }
    bd.ep = parts[3] && parts[3] !== '-' ? sqFromName(parts[3]) : -1;
    bd.half = parts[4] ? +parts[4] : 0;
    bd.full = parts[5] ? +parts[5] : 1;
    return bd;
  }

  toFEN() {
    let rows = [];
    for (let r = 7; r >= 0; r--) {
      let row = '', empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.b[r * 16 + f];
        if (!p) { empty++; continue; }
        if (empty) { row += empty; empty = 0; }
        const l = PIECE_LETTER[pieceType(p)];
        row += pieceColor(p) === WHITE ? l.toUpperCase() : l;
      }
      if (empty) row += empty;
      rows.push(row);
    }
    let c = '';
    if (this.castling & CK) c += 'K';
    if (this.castling & CQ) c += 'Q';
    if (this.castling & ck) c += 'k';
    if (this.castling & cq) c += 'q';
    return `${rows.join('/')} ${this.turn === WHITE ? 'w' : 'b'} ${c || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
  }

  isAttacked(sq, byColor) {
    const b = this.b;
    // pawns
    if (byColor === WHITE) {
      if (onBoard(sq - 15) && b[sq - 15] === (PAWN | WHITE)) return true;
      if (onBoard(sq - 17) && b[sq - 17] === (PAWN | WHITE)) return true;
    } else {
      if (onBoard(sq + 15) && b[sq + 15] === (PAWN | BLACK)) return true;
      if (onBoard(sq + 17) && b[sq + 17] === (PAWN | BLACK)) return true;
    }
    // knights
    for (const o of KNIGHT_OFF) {
      const t = sq + o;
      if (onBoard(t) && b[t] === (KNIGHT | byColor)) return true;
    }
    // king
    for (const o of KING_OFF) {
      const t = sq + o;
      if (onBoard(t) && b[t] === (KING | byColor)) return true;
    }
    // sliders
    for (const o of BISHOP_OFF) {
      let t = sq + o;
      while (onBoard(t)) {
        const p = b[t];
        if (p) {
          if (pieceColor(p) === byColor && (pieceType(p) === BISHOP || pieceType(p) === QUEEN)) return true;
          break;
        }
        t += o;
      }
    }
    for (const o of ROOK_OFF) {
      let t = sq + o;
      while (onBoard(t)) {
        const p = b[t];
        if (p) {
          if (pieceColor(p) === byColor && (pieceType(p) === ROOK || pieceType(p) === QUEEN)) return true;
          break;
        }
        t += o;
      }
    }
    return false;
  }

  inCheck(color) {
    return this.isAttacked(this.kingSq[color], opp(color));
  }

  // pseudo-legal moves for the side to move
  pseudoMoves() {
    const moves = [];
    const b = this.b, turn = this.turn;
    const push = (from, to, piece, flags, captured, promo) =>
      moves.push({ from, to, piece, captured: captured || 0, promo: promo || 0, flags });

    for (let sq = 0; sq < 128; sq++) {
      if (!onBoard(sq)) continue;
      const p = b[sq];
      if (!p || pieceColor(p) !== turn) continue;
      const t = pieceType(p);
      const rank = sq >> 4, file = sq & 7;

      if (t === PAWN) {
        const dir = turn === WHITE ? 16 : -16;
        const startRank = turn === WHITE ? 1 : 6;
        const promoRank = turn === WHITE ? 7 : 0;
        const one = sq + dir;
        if (onBoard(one) && !b[one]) {
          if ((one >> 4) === promoRank) {
            for (const pr of [QUEEN, ROOK, BISHOP, KNIGHT]) push(sq, one, p, 'p', 0, pr);
          } else {
            push(sq, one, p, 'n');
            const two = sq + dir * 2;
            if (rank === startRank && !b[two]) push(sq, two, p, 'b');
          }
        }
        for (const o of [dir - 1, dir + 1]) {
          const to = sq + o;
          if (!onBoard(to)) continue;
          if ((to >> 4) === promoRank) {
            if (b[to] && pieceColor(b[to]) !== turn) {
              for (const pr of [QUEEN, ROOK, BISHOP, KNIGHT])
                push(sq, to, p, 'p', pieceType(b[to]), pr);
            }
          } else if (b[to] && pieceColor(b[to]) !== turn) {
            push(sq, to, p, 'c', pieceType(b[to]));
          } else if (to === this.ep) {
            push(sq, to, p, 'e', PAWN);
          }
        }
      } else if (t === KNIGHT || t === KING) {
        const offs = t === KNIGHT ? KNIGHT_OFF : KING_OFF;
        for (const o of offs) {
          const to = sq + o;
          if (!onBoard(to)) continue;
          const tp = b[to];
          if (!tp) push(sq, to, p, 'n');
          else if (pieceColor(tp) !== turn) push(sq, to, p, 'c', pieceType(tp));
        }
        if (t === KING) {
          // castling
          const home = turn === WHITE ? 0x04 : 0x74;
          if (sq === home && !this.inCheck(turn)) {
            const kSide = turn === WHITE ? CK : ck;
            const qSide = turn === WHITE ? CQ : cq;
            if ((this.castling & kSide) && !b[sq + 1] && !b[sq + 2] &&
                b[sq + 3] === (ROOK | turn) &&
                !this.isAttacked(sq + 1, opp(turn)) && !this.isAttacked(sq + 2, opp(turn))) {
              push(sq, sq + 2, p, 'k');
            }
            if ((this.castling & qSide) && !b[sq - 1] && !b[sq - 2] && !b[sq - 3] &&
                b[sq - 4] === (ROOK | turn) &&
                !this.isAttacked(sq - 1, opp(turn)) && !this.isAttacked(sq - 2, opp(turn))) {
              push(sq, sq - 2, p, 'q');
            }
          }
        }
      } else {
        const offs = t === BISHOP ? BISHOP_OFF : t === ROOK ? ROOK_OFF : KING_OFF;
        for (const o of offs) {
          let to = sq + o;
          while (onBoard(to)) {
            const tp = b[to];
            if (!tp) push(sq, to, p, 'n');
            else {
              if (pieceColor(tp) !== turn) push(sq, to, p, 'c', pieceType(tp));
              break;
            }
            to += o;
          }
        }
      }
    }
    return moves;
  }

  legalMoves() {
    const out = [];
    for (const m of this.pseudoMoves()) {
      if (m.captured === KING) continue; // capturing the king is never legal
      const undo = this.make(m);
      if (!this.inCheck(opp(this.turn))) out.push(m);
      this.unmake(m, undo);
    }
    return out;
  }

  make(m) {
    const undo = {
      capturedSq: m.to, captured: this.b[m.to],
      castling: this.castling, ep: this.ep, half: this.half,
    };
    const b = this.b;
    const piece = b[m.from];
    const color = pieceColor(piece);
    const type = pieceType(piece);

    b[m.from] = EMPTY;
    // en passant capture: captured pawn is behind the target square
    if (m.flags === 'e') {
      const capSq = m.to + (color === WHITE ? -16 : 16);
      undo.capturedSq = capSq;
      undo.captured = b[capSq];
      b[capSq] = EMPTY;
    }
    b[m.to] = m.promo ? (m.promo | color) : piece;

    if (type === KING) {
      this.kingSq[color] = m.to;
      if (m.flags === 'k') { // kingside: rook h->f
        b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = EMPTY;
      } else if (m.flags === 'q') { // queenside: rook a->d
        b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = EMPTY;
      }
      this.castling &= color === WHITE ? ~(CK | CQ) : ~(ck | cq);
    }
    // rook moves / captures update castling rights
    const clearRight = (sq, bit) => {
      if (m.from === sq || m.to === sq) this.castling &= ~bit;
    };
    clearRight(0x00, CQ); clearRight(0x07, CK);
    clearRight(0x70, cq); clearRight(0x77, ck);

    this.ep = m.flags === 'b' ? m.from + (color === WHITE ? 16 : -16) : -1;
    this.half = (type === PAWN || undo.captured) ? 0 : this.half + 1;
    if (color === BLACK) this.full++;
    this.turn = opp(color);
    this.undoStack.push(undo);
    return undo;
  }

  unmake(m, undo) {
    const b = this.b;
    const color = opp(this.turn);
    const piece = m.promo ? (PAWN | color) : b[m.to];
    b[m.from] = piece;
    b[m.to] = EMPTY;
    if (m.flags === 'e') {
      b[undo.capturedSq] = undo.captured;
    } else if (undo.captured) {
      b[m.to] = undo.captured;
    }
    if (pieceType(piece) === KING) {
      this.kingSq[color] = m.from;
      if (m.flags === 'k') { b[m.to + 1] = b[m.to - 1]; b[m.to - 1] = EMPTY; }
      else if (m.flags === 'q') { b[m.to - 2] = b[m.to + 1]; b[m.to + 1] = EMPTY; }
    }
    this.castling = undo.castling;
    this.ep = undo.ep;
    this.half = undo.half;
    if (color === BLACK) this.full--;
    this.turn = color;
    this.undoStack.pop();
  }

  // apply a UCI string like 'e2e4' or 'e7e8q'; returns the move or null
  moveFromUci(uci) {
    const from = sqFromName(uci.slice(0, 2));
    const to = sqFromName(uci.slice(2, 4));
    const promo = uci.length > 4
      ? { q: QUEEN, r: ROOK, b: BISHOP, n: KNIGHT }[uci[4]] : 0;
    for (const m of this.legalMoves()) {
      if (m.from === from && m.to === to && (m.promo || 0) === promo) return m;
    }
    return null;
  }

  gameResult() {
    // null = ongoing, '1-0' | '0-1' | '1/2-1/2'
    if (this.legalMoves().length === 0) {
      return this.inCheck(this.turn)
        ? (this.turn === WHITE ? '0-1' : '1-0')
        : '1/2-1/2';
    }
    if (this.half >= 100) return '1/2-1/2';
    return null;
  }

  // Position sanity: hard legality invariants for curated tutor positions.
  // Returns a list of problems; empty means the position could occur in a
  // real game with this side to move. This is NOT a full reachability proof
  // (no retrograde analysis) — it catches the impossible setups that slip
  // past move generation: missing/extra kings, adjacent kings, pawns on the
  // back rank, impossible piece counts, a game already over, the side NOT
  // to move in check, or no legal move for the side to move. Starting in
  // check is legal and is not flagged.
  validate() {
    const problems = [];
    let wk = 0, bk = 0, wp = 0, bp = 0, wPawns = 0, bPawns = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (!onBoard(sq)) continue;
      const p = this.b[sq];
      if (!p) continue;
      const t = pieceType(p), c = pieceColor(p);
      if (t === KING) { if (c === WHITE) wk++; else bk++; }
      if (t === PAWN) {
        if (sq < 16 || sq >= 112) problems.push('pawn on 1st/8th rank');
        if (c === WHITE) wPawns++; else bPawns++;
      }
      if (c === WHITE) wp++; else bp++;
    }
    if (wk !== 1) problems.push(`white kings: ${wk}`);
    if (bk !== 1) problems.push(`black kings: ${bk}`);
    if (wk === 1 && bk === 1) {
      const wks = this.kingSq[WHITE], bks = this.kingSq[BLACK];
      if (Math.abs((wks & 7) - (bks & 7)) <= 1 && Math.abs((wks >> 4) - (bks >> 4)) <= 1) {
        problems.push('kings adjacent');
      }
    }
    if (wp > 16) problems.push(`too many white pieces: ${wp}`);
    if (bp > 16) problems.push(`too many black pieces: ${bp}`);
    if (wPawns > 8) problems.push(`too many white pawns: ${wPawns}`);
    if (bPawns > 8) problems.push(`too many black pawns: ${bPawns}`);
    const other = opp(this.turn);
    if (this.inCheck(other)) problems.push('side not to move is in check');
    const res = this.gameResult();
    if (res) problems.push(`game already over: ${res}`);
    return problems;
  }

  // SAN for a move (requires the move to be legal in current position)
  toSan(m) {
    if (m.flags === 'k') return 'O-O';
    if (m.flags === 'q') return 'O-O-O';
    const type = pieceType(m.piece);
    const dest = sqName(m.to);
    const isCap = m.captured || m.flags === 'e';
    if (type === PAWN) {
      let s = isCap ? 'abcdefgh'[m.from & 7] + 'x' : '';
      s += dest;
      if (m.promo) s += '=' + PIECE_LETTER[m.promo].toUpperCase();
      const undo = this.make(m);
      const enemy = this.turn;
      if (this.inCheck(enemy) && this.legalMoves().length === 0) s += '#';
      else if (this.inCheck(enemy)) s += '+';
      this.unmake(m, undo);
      return s;
    }
    let s = PIECE_LETTER[type].toUpperCase();
    // disambiguation
    const others = this.legalMoves().filter(x =>
      x.to === m.to && x.from !== m.from && pieceType(x.piece) === type);
    if (others.length) {
      const sameFile = others.some(x => (x.from & 7) === (m.from & 7));
      const sameRank = others.some(x => (x.from >> 4) === (m.from >> 4));
      if (!sameFile) s += 'abcdefgh'[m.from & 7];
      else if (!sameRank) s += ((m.from >> 4) + 1);
      else s += sqName(m.from);
    }
    if (isCap) s += 'x';
    s += dest;
    const undo = this.make(m);
    const enemy = this.turn;
    if (this.inCheck(enemy) && this.legalMoves().length === 0) s += '#';
    else if (this.inCheck(enemy)) s += '+';
    this.unmake(m, undo);
    return s;
  }
}

export function perft(board, depth) {
  if (depth === 0) return 1;
  let nodes = 0;
  for (const m of board.legalMoves()) {
    const undo = board.make(m);
    nodes += perft(board, depth - 1);
    board.unmake(m, undo);
  }
  return nodes;
}
