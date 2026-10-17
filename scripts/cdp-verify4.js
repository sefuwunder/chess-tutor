// CDP verification via data: URL. Assumes chrome running on [::1]:9222.
import { readFileSync } from 'fs';
const CDP = 'http://[::1]:9222';
const CLICK_HELPER = `(() => {
  window.__clickSq = (uci) => {
    const sqs = [...document.querySelectorAll('.sq')];
    const el = sqs.find(el => {
      const sq = +el.dataset.sq; const f = sq & 7, r = sq >> 4;
      return 'abcdefgh'[f] + (r+1) === uci;
    });
    if (el) el.click();
    return !!el;
  };
})()`;

async function cdp() {
  const res = await fetch(`${CDP}/json/new`, { method: 'PUT', body: JSON.stringify({}) });
  const target = await res.json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = new Map();
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  const send = (method, params = {}) => new Promise(resolve => { const myId = ++id; pending.set(myId, resolve); ws.send(JSON.stringify({ id: myId, method, params })); });
  const evalJs = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
  await send('Runtime.enable');
  const html = readFileSync('/tmp/chess-tutor-test.html', 'utf8');
  await send('Page.navigate', { url: 'data:text/html,' + encodeURIComponent(html) });
  await Bun.sleep(4000);
  await evalJs(`window.__errs=[]; window.addEventListener('error', e => window.__errs.push(e.message));`);
  await evalJs(CLICK_HELPER);
  await Bun.sleep(300);

  console.log('squares:', await evalJs(`document.querySelectorAll('.sq').length`));
  console.log('pieces:', await evalJs(`document.querySelectorAll('.sq .pc').length`));

  // e2e4
  await evalJs(`window.__clickSq('e2')`); await Bun.sleep(200);
  await evalJs(`window.__clickSq('e4')`); await Bun.sleep(400);
  console.log('moves:', await evalJs(`document.querySelector('#moves').textContent.trim().slice(0,30)`));

  // analysis
  console.log('analyzing...');
  await evalJs(`document.querySelector('#analyze-btn').click()`);
  await Bun.sleep(8000);
  console.log('eval:', await evalJs(`document.querySelector('#eval-line').textContent.trim().slice(0,60)`));
  console.log('breakdown n:', await evalJs(`document.querySelectorAll('#breakdown li').length`));
  console.log('first:', await evalJs(`document.querySelector('#breakdown li')?.textContent.slice(0,60)`));

  // tactics: puzzle 1 is e4d6
  console.log('tactics...');
  await evalJs(`document.querySelector('nav button[data-mode=tactics]').click()`);
  await Bun.sleep(800);
  await evalJs(`window.__clickSq('e4')`); await Bun.sleep(200);
  await evalJs(`window.__clickSq('d6')`); await Bun.sleep(800);
  console.log('puzzle fb:', await evalJs(`document.querySelector('#puzzle-feedback').textContent.slice(0,70)`));

  // lessons
  console.log('lessons...');
  await evalJs(`document.querySelector('nav button[data-mode=lessons]').click()`);
  await Bun.sleep(800);
  console.log('header:', await evalJs(`document.querySelector('#panel h2').textContent`));
  console.log('card:', await evalJs(`document.querySelector('.lesson-card p').textContent.slice(0,60)`));

  console.log('JS errors:', await evalJs(`window.__errs.join(' | ')`) || '(none)');
  ws.close(); console.log('DONE');
}
cdp().catch(e => { console.error('FATAL', e); process.exit(1); });
