// Focused candidate test for failed puzzle slots.
import { analyze, formatScore, MATE_SCORE } from '../src/search.js';

const C = [
  { id: 'p2', fen: '6k1/5ppp/8/8/8/8/5PPP/2R3K1 w - - 0 1', want: 'c1c8' },
  { id: 'p5', fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1', want: 'd1d8' },
  { id: 'p7', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', want: 'a1a8' },
  { id: 'p8', fen: '3qk3/5ppp/8/8/4N3/8/5PPP/4K3 w - - 0 1', want: null },
  { id: 'p9', fen: '4k3/8/8/3n4/8/8/4P3/4R1K1 w - - 0 1', want: 'e2e4' },
  { id: 'p14', fen: '6k1/5p2/8/8/3Q4/7P/5PPP/6K1 w - - 0 1', want: 'd4g7' },
  { id: 'p15', fen: '5bk1/5ppp/8/8/3Q4/8/5PPP/2R3K1 w - - 0 1', want: 'd4d8' },
  { id: 'p17a', fen: 'r1bq1rk1/ppp2ppp/2n5/2b1p3/2B1P3/3P1N2/PPPQ1PPP/RNB2RK1 w - - 0 1', want: 'd3h7' },
  { id: 'p17b', fen: '6k1/5ppp/8/8/8/3B4/5PPP/3Q2K1 w - - 0 1', want: 'd3h7' },
  { id: 'p18', fen: 'r1bqk2r/pppp1ppp/2n5/2b1p3/4P3/3P1N2/PPP2PPP/RNBQKB1R w KQkq - 0 1', want: 'f3g5' },
  { id: 'p19', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3', want: 'c1b5' },
  { id: 'p21', fen: 'r3k2r/5ppp/8/6n1/8/8/3Q1PPP/4K3 b - - 0 1', want: 'g5f3' },
  { id: 'p22', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R b KQkq - 0 1', want: 'f6e4' },
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
