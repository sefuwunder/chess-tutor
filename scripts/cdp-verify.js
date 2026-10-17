// CDP verification for chess-tutor. Uses sandbox Chromium via remote debugging.
const CDP_PORT = 9222;

async function cdp() {
  // launch chromium
  const proc = Bun.spawn(['/opt/meta-chromium/chrome', '--headless', '--no-sandbox',
    `--remote-debugging-port=${CDP_PORT}`, '--disable-gpu', 'about:blank'],
    { stdout: 'ignore', stderr: 'ignore' });
  await Bun.sleep(2000);

  // create target
  const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new`, { method: 'PUT', body: JSON.stringify({}) });
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

  const errors = [];
  // capture console errors via Runtime
  await send('Runtime.enable');
  // poll for errors by checking a global hook
  await evalJs(`window.__errs=[]; window.addEventListener('error', e => window.__errs.push(e.message));`);

  console.log('navigating...');
  await send('Page.navigate', { url: 'http://127.0.0.1:3033/' });
  await Bun.sleep(3000);

  const err1 = await evalJs(`window.__errs.join(' | ')`);
  console.log('JS errors after load:', err1 || '(none)');
  const title = await evalJs(`document.title`);
  console.log('title:', title);
  const squares = await evalJs(`document.querySelectorAll('.sq').length`);
  console.log('board squares:', squares);
  const pieces = await evalJs(`document.querySelectorAll('.sq .pc').length`);
  console.log('pieces:', pieces);

  // make a move: click e2 then e4
  const moveOk = await evalJs(`(() => {
    const sqs = document.querySelectorAll('.sq');
    // find e2 (depends on orientation; use data-sq)
    const find = uci => [...sqs].find(el => {
      const sq = +el.dataset.sq;
      const f = sq & 7, r = sq >> 4;
      return 'abcdefgh'[f] + (r+1) === uci;
    });
    find('e2').click(); find('e4').click();
    return document.querySelectorAll('.sq .pc').length;
  })()`);
  console.log('pieces after e2e4:', moveOk);
  const movesText = await evalJs(`document.querySelector('#moves').textContent.trim().slice(0,40)`);
  console.log('move list:', movesText);

  // run analysis
  console.log('running analysis...');
  await evalJs(`document.querySelector('#analyze-btn').click()`);
  await Bun.sleep(6000);
  const evalLine = await evalJs(`document.querySelector('#eval-line').textContent.trim().slice(0,80)`);
  console.log('eval line:', evalLine);
  const breakdownCount = await evalJs(`document.querySelectorAll('#breakdown li').length`);
  console.log('breakdown sentences:', breakdownCount);
  const firstSentence = await evalJs(`document.querySelector('#breakdown li')?.textContent.slice(0,70)`);
  console.log('first sentence:', firstSentence);
  const err2 = await evalJs(`window.__errs.join(' | ')`);
  console.log('JS errors after analysis:', err2 || '(none)');

  // tactics mode
  console.log('switching to tactics...');
  await evalJs(`document.querySelector('nav button[data-mode=tactics]').click()`);
  await Bun.sleep(1000);
  const tacticPieces = await evalJs(`document.querySelectorAll('.sq .pc').length`);
  console.log('tactic pieces:', tacticPieces);
  // solve puzzle 1: e4d6 (knight fork)
  const solve = await evalJs(`(() => {
    const sqs = document.querySelectorAll('.sq');
    const find = uci => [...sqs].find(el => {
      const sq = +el.dataset.sq;
      const f = sq & 7, r = sq >> 4;
      return 'abcdefgh'[f] + (r+1) === uci;
    });
    find('e4').click(); find('d6').click();
    return document.querySelector('#puzzle-feedback').textContent.slice(0,60);
  })()`);
  console.log('puzzle feedback:', solve);
  const err3 = await evalJs(`window.__errs.join(' | ')`);
  console.log('JS errors after tactics:', err3 || '(none)');

  // lessons mode
  console.log('switching to lessons...');
  await evalJs(`document.querySelector('nav button[data-mode=lessons]').click()`);
  await Bun.sleep(1000);
  const lessonTitle = await evalJs(`document.querySelector('#panel h2').textContent`);
  console.log('lessons header:', lessonTitle);
  const cardText = await evalJs(`document.querySelector('.lesson-card p').textContent.slice(0,60)`);
  console.log('lesson card:', cardText);
  const err4 = await evalJs(`window.__errs.join(' | ')`);
  console.log('JS errors after lessons:', err4 || '(none)');

  ws.close();
  proc.kill();
  console.log('DONE');
}
cdp().catch(e => { console.error('FATAL', e); process.exit(1); });
