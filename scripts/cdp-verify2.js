// CDP verification via data: URL (bypasses loopback block).
const CDP_PORT = 9222;
import { readFileSync } from 'fs';

async function cdp() {
  const proc = Bun.spawn(['/opt/meta-chromium/chrome', '--headless', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`, '--disable-gpu', 'about:blank'],
    { stdout: 'ignore', stderr: 'ignore' });
  await Bun.sleep(2500);

  const res = await fetch(`http://[::1]:${CDP_PORT}/json/new`, { method: 'PUT', body: JSON.stringify({}) });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise(resolve => {
    const myId = ++id;
    pending.set(myId, resolve);
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return r.result?.result?.value;
  };

  await send('Runtime.enable');
  const html = readFileSync('/tmp/chess-tutor-test.html', 'utf8');
  const dataUrl = 'data:text/html,' + encodeURIComponent(html);
  console.log('navigating to data URL...');
  await send('Page.navigate', { url: dataUrl });
  await Bun.sleep(4000);

  await evalJs(`window.__errs=[]; window.addEventListener('error', e => window.__errs.push(e.message));`);
  // re-navigate to capture load errors? No — check now
  const err1 = await evalJs(`window.__errs.join(' | ')`);
  console.log('JS errors:', err1 || '(none)');
  const squares = await evalJs(`document.querySelectorAll('.sq').length`);
  console.log('board squares:', squares);
  const pieces = await evalJs(`document.querySelectorAll('.sq .pc').length`);
  console.log('pieces:', pieces);

  if (squares === 64) {
    // make a move: e2 -> e4
    await evalJs(`(() => {
      const sqs = [...document.querySelectorAll('.sq')];
      const find = uci => sqs.find(el => {
        const sq = +el.dataset.sq; const f = sq & 7, r = sq >> 4;
        return 'abcdefgh'[f] + (r+1) === uci;
      });
      find('e2').click(); find('e4').click();
    })()`);
    await Bun.sleep(500);
    const movesText = await evalJs(`document.querySelector('#moves').textContent.trim().slice(0,30)`);
    console.log('move list after e4:', movesText);

    // run analysis
    console.log('running analysis...');
    await evalJs(`document.querySelector('#analyze-btn').click()`);
    await Bun.sleep(8000);
    const evalLine = await evalJs(`document.querySelector('#eval-line').textContent.trim().slice(0,60)`);
    console.log('eval line:', evalLine);
    const n = await evalJs(`document.querySelectorAll('#breakdown li').length`);
    console.log('breakdown sentences:', n);
    const s1 = await evalJs(`document.querySelector('#breakdown li')?.textContent.slice(0,60)`);
    console.log('first:', s1);

    // tactics
    console.log('tactics...');
    await evalJs(`document.querySelector('nav button[data-mode=tactics]').click()`);
    await Bun.sleep(800);
    await evalJs(`(() => {
      const sqs = [...document.querySelectorAll('.sq')];
      const find = uci => sqs.find(el => {
        const sq = +el.dataset.sq; const f = sq & 7, r = sq >> 4;
        return 'abcdefgh'[f] + (r+1) === uci;
      });
      find('e4').click(); find('d6').click();
    })()`);
    await Bun.sleep(500);
    const fb = await evalJs(`document.querySelector('#puzzle-feedback').textContent.slice(0,50)`);
    console.log('puzzle feedback:', fb);

    // lessons
    console.log('lessons...');
    await evalJs(`document.querySelector('nav button[data-mode=lessons]').click()`);
    await Bun.sleep(800);
    const lh = await evalJs(`document.querySelector('#panel h2').textContent`);
    const lc = await evalJs(`document.querySelector('.lesson-card p').textContent.slice(0,50)`);
    console.log('lessons:', lh, '|', lc);
  }

  const errF = await evalJs(`window.__errs.join(' | ')`);
  console.log('final JS errors:', errF || '(none)');
  ws.close();
  proc.kill();
  console.log('DONE');
}
cdp().catch(e => { console.error('FATAL', e); process.exit(1); });
