// Build a self-contained test HTML by inlining engine modules.
import { readFileSync, writeFileSync } from 'fs';

const root = '/home/hatch/workspace/your_files/chess-tutor/';
let html = readFileSync(root + 'public/index.html', 'utf8');

const engine = readFileSync(root + 'src/engine.js', 'utf8');
const search = readFileSync(root + 'src/search.js', 'utf8');
const puzzles = readFileSync(root + 'src/puzzles.js', 'utf8');
const lessons = readFileSync(root + 'src/lessons.js', 'utf8');

// Remove export keywords for inlining (they're modules, we'll make them scripts)
const strip = (code) => code
  .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ')
  .replace(/^export\s*\{[^}]*\};?/gm, '')
  .replace(/^export\s+default\s+/gm, '');

const inline = `
<script>
${strip(engine)}
${strip(search)}
${strip(puzzles)}
${strip(lessons)}
</script>
<script>
${readFileSync(root + 'public/app-inline.js', 'utf8')}
</script>`;

// Extract the module script content and convert imports
let appCode = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
// Remove import lines (we inlined)
appCode = appCode.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');

html = html.replace(/<script type="module">[\s\S]*?<\/script>/,
  `<script>\n${strip(engine)}\n${strip(search)}\n${strip(puzzles)}\n${strip(lessons)}\n</script>\n<script>\n${appCode}\n</script>`);

writeFileSync('/tmp/chess-tutor-test.html', html);
console.log('wrote /tmp/chess-tutor-test.html', html.length, 'bytes');
