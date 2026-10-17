// chess-tutor server: static files, 127.0.0.1:3033, zero dependencies.
const root = new URL('../', import.meta.url).pathname;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

Bun.serve({
  hostname: '127.0.0.1',
  port: 3033,
  async fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path === '/') path = '/public/index.html';
    // Only serve public/ and src/ (engine ESM for the browser).
    if (!path.startsWith('/public/') && !path.startsWith('/src/')) {
      return new Response('Not found', { status: 404 });
    }
    const file = Bun.file(root + path.slice(1));
    if (!(await file.exists())) return new Response('Not found', { status: 404 });
    const ext = path.slice(path.lastIndexOf('.'));
    return new Response(file, {
      headers: { 'Content-Type': TYPES[ext] || 'application/octet-stream' },
    });
  },
});
console.log('chess-tutor on http://127.0.0.1:3033');
