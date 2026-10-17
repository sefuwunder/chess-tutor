// Final candidate batch for remaining slots.
import { analyze, formatScore, MATE_SCORE } from '../src/search.js';

const C = [
  // p8: try a few simple tactics
  { id: 'p8a', fen: '3qk3/5ppp/8/8/4N3/8/5PPP/4K3 w - - 0 1', want: null },
  { id: 'p8b', fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', want: 'd1d8' },
  // p9: discovered (corrected: pawn captures off the file)
  { id: 'p9', fen: '4k3/8/8/3n4/4P3/8/5PPP/4R1K1 w - - 0 1', want: 'e4d5' },
  // p14: corrected FEN (pawn on h6)
  { id: 'p14', fen: '6k1/5p2/7P/8/3Q4/8/5PPP/6K1 w - - 0 1', want: 'd4g7' },
  // p15: deflection (Re8+/Qxe8#)
  { id: 'p15', fen: '3q2k1/5ppp/8/8/8/8/5PPP/3QR1K1 w - - 0 1', want: 'e1e8' },
  // p17: decoy attempts
  { id: 'p17a', fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', want: 'd1d8' },
  { id: 'p17b', fen: '5rk1/5ppp/8/8/8/8/5QPP/6K1 w - - 0 1', want: null },
  // p18: clearance attempts
  { id: 'p18a', fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1', want: 'f3g5' },
  { id: 'p18b', fen: '4k3/8/8/3p4/4P3/8/5PPP/4K3 w - - 0 1', want: null },
  // p19: x-ray attempts
  { id: 'p19a', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', want: 'c1b5' },
  { id: 'p19b', fen: '4k3/8/8/8/8/8/3R4/4K3 w - - 0 1', want: null },
  // p21: black fork (simpler)
  { id: 'p21a', fen: 'r3k2r/5ppp/8/6n1/8/8/3Q1PPP/4K3 b - - 0 1', want: 'g5f3' },
  { id: 'p21b', fen: '4k3/8/8/8/8/8/3q4/4K3 b - - 0 1', want: null },
];

for (const c of C) {
  const t = Date.now();
  const r = analyze(c.fen, 4, 30000, 5000000);
  const winning = r.score > 150 || Math.abs(r.score) > MATE_SCORE - 1000;
  const okMove = c.want ? r.bestUci === c.want : true;
  console.log(okMove && winning ? 'PASS' : 'FAIL', c.id, '| got', r.bestUci,
    c.want ? `(want ${c.want})` : '(any)', '|', formatScore(r.score, r.turn),
    'pv:', r.pvSan.slice(0, 3).join(' '), ((Date.now() - t) / 1000).toFixed(1) + 's');
}
