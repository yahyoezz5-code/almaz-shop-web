const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

const html = readFileSync(`${__dirname}/../index.html`, 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n');
const uid = '123456789';
const nickname = '★ Player <One> ★';
const response = data => ({ ok: true, json: async () => data });

function setup(fetch, saved = {}) {
  const elements = new Map();
  const storage = values => ({
    getItem: key => values[key] ?? null,
    setItem: (key, value) => { values[key] = String(value); },
    removeItem: key => { delete values[key]; }
  });
  const el = id => {
    if (!elements.has(id)) elements.set(id, {
      value: '', style: {}, classList: { toggle() {}, add() {}, remove() {} }, focus() {}
    });
    return elements.get(id);
  };
  const sent = [], alerts = [], timers = new Map();
  let timerId = 0;
  const context = vm.createContext({
    window: { Telegram: { WebApp: { ready() {}, expand() {}, sendData: data => sent.push(JSON.parse(data)) } } },
    document: { getElementById: el, body: el('body'), querySelectorAll: () => [], querySelector: el },
    localStorage: storage({ almaz_sound: '0', almaz_balance: '100', ...saved }),
    sessionStorage: storage({}), fetch, AbortController,
    setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; },
    clearTimeout: id => timers.delete(id),
    alert: message => alerts.push(message), confirm: () => true
  });
  vm.runInContext(source, context);
  el('playerId').value = uid;
  return { context, el, sent, alerts, timers, state: code => vm.runInContext(code, context) };
}

test('live and cached results display only the exact nickname and checkout uses it', async () => {
  let calls = 0;
  const app = setup(async () => { calls++; return response({ basicInfo: { nickname, level: 75, rank: 42 } }); });
  await app.context.checkUID();
  assert.equal(app.el('verifyResult').innerText, '✅ ' + nickname);
  assert.equal(app.state('verifiedName'), nickname);
  app.context.resetVerify();
  await app.context.checkUID();
  assert.equal(calls, 1);
  assert.equal(app.el('verifyResult').innerText, '✅ ' + nickname);
  app.context.buyItem(app.state('PACKAGES[0].id'));
  assert.equal(app.sent[0].ff_name, nickname);
  assert.equal(app.sent[0].uid, uid);
});

for (const [name, fetch] of [
  ['level without nickname', async () => response({ basicInfo: { level: 75 } })],
  ['non-string nickname', async () => response({ basicInfo: { nickname: 75 } })],
  ['blank nickname', async () => response({ basicInfo: { nickname: '  ' } })],
  ['explicit failure', async () => response({ success: false, basicInfo: { nickname } })],
  ['HTTP failure', async () => ({ ok: false })],
  ['invalid JSON', async () => ({ ok: true, json: async () => { throw new Error('JSON'); } })],
  ['network failure', async () => { throw new Error('Offline'); }]
]) {
  test(`${name} cannot verify or place an order`, async () => {
    const app = setup(fetch);
    await app.context.checkUID();
    assert.equal(app.state('verifiedName'), null);
    assert.equal(app.el('verifyResult').className, 'verify-result err');
    assert.equal(app.el('checkBtn').disabled, false);
    assert.equal(app.context.ffCacheGet('CIS:' + uid), null);
    assert.equal(app.timers.size, 0);
    app.context.buyItem(app.state('PACKAGES[0].id'));
    assert.equal(app.sent.length, 0);
    assert.equal(app.context.localStorage.getItem('almaz_balance'), '100');
  });
}

test('old fabricated names in persistent and session storage are ignored', async () => {
  const app = setup(async () => response({ basicInfo: { nickname } }), {
    almaz_saved_uid: uid, almaz_saved_nick: 'FF_6789'
  });
  assert.equal(app.state('verifiedName'), null);
  app.context.sessionStorage.setItem('ffcheck_CIS:' + uid,
    JSON.stringify({ nickname: 'FF_6789', level: '✓', ts: Date.now() }));
  await app.context.checkUID();
  assert.equal(app.state('verifiedName'), nickname);
});

test('editing UID or region during lookup prevents a stale success', async () => {
  for (const change of [app => { app.el('playerId').value = '987654321'; }, app => app.state('currentRegion = "BR"')]) {
    let resolve;
    const app = setup(() => new Promise(done => { resolve = done; }));
    const pending = app.context.checkUID();
    change(app);
    app.context.resetVerify();
    resolve(response({ basicInfo: { nickname } }));
    await pending;
    assert.equal(app.state('verifiedName'), null);
    assert.equal(app.el('verifyResult').style.display, 'none');
    assert.equal(app.el('checkBtn').disabled, false);
  }
});

test('timeout shows an error and releases the check button', async () => {
  const app = setup((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('Timeout')));
  }));
  const pending = app.context.checkUID();
  [...app.timers.values()].find(timer => timer.delay === 10000).callback();
  await pending;
  assert.equal(app.el('verifyResult').className, 'verify-result err');
  assert.equal(app.state('verifiedName'), null);
  assert.equal(app.el('checkBtn').disabled, false);
  assert.equal(app.timers.size, 0);
});

test('checkout rejects a different UID even without an input event', async () => {
  const app = setup(async () => response({ basicInfo: { nickname } }));
  await app.context.checkUID();
  app.el('playerId').value = '987654321';
  app.context.buyItem(app.state('PACKAGES[0].id'));
  assert.equal(app.sent.length, 0);
  assert.equal(app.context.localStorage.getItem('almaz_balance'), '100');
});
