// Puzzle verification: checks each puzzle's solution is the engine's
// best move at depth 4 and winning. Run: bun scripts/verify-puzzles.js
import { analyze, formatScore, MATE_SCORE } from '../src/search.js';
import { PUZZLES } from '../src/puzzles.js';

let pass = 0, fail = 0;
for (const p of PUZZLES) {
  const t = Date.now();
  const r = analyze(p.fen, 4, 30000, 5000000);
  const winning = r.score > 150 || Math.abs(r.score) > MATE_SCORE - 1000;
  const okMove = r.bestUci === p.solution[0];
  const ok = okMove && winning;
  if (ok) pass++; else fail++;
  console.log(ok ? 'PASS' : 'FAIL', 'p' + p.id, p.motif, '| got', r.bestUci,
    `(want ${p.solution[0]})`, '|', formatScore(r.score, r.turn),
    ((Date.now() - t) / 1000).toFixed(1) + 's');
}
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
