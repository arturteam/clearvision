// Run with Node: node tests/bogo.test.cjs. No network or real coupons.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync('assets/bogo/bogo.js', 'utf8');
async function setup(lang = 'en', storage = new Map()) {
  const nodes = new Map();
  const get = s => {
    if (!nodes.has(s)) nodes.set(s, { value: '', textContent: '', hidden: true, disabled: false,
      addEventListener(type, fn) { this[type] = fn; }, focus() {} });
    return nodes.get(s);
  };
  get('#order').value = 'GPA.1234-5678-9012-34567';
  get('#purchased').value = 'CV07';
  get('input[name="gift"]:checked').value = 'CV02';
  let callback, handler, calls = [], reset = 0;
  const context = { document: { documentElement: { lang }, querySelector: get,
      querySelectorAll: () => [], createElement: () => ({}), head: { appendChild() {} }, body: {} },
    crypto: webcrypto, TextEncoder, Uint8Array, AbortSignal, Date, Number,
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v) },
    MutationObserver: class { observe() {} }, navigator: { clipboard: { writeText: async () => {} } },
    turnstile: { render: (_, options) => { assert.equal(options.action, 'bogo'); callback = options.callback; return 0; }, reset: () => reset++ },
    fetch: async (url, options) => { const payload = JSON.parse(options.body); assert.ok([...storage.values()].includes(payload.recovery)); calls.push(payload); return handler(); }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  context.cvBogoTurnstileReady();
  return { get, storage, calls, context, setResponse: fn => handler = fn,
    submit: async () => { callback('TEST-TOKEN'); await get('#bogo-form').submit({ preventDefault() {} }); },
    resets: () => reset };
}
(async () => {
  for (const lang of ['en', 'pl']) {
    const t = await setup(lang);
    assert.match(t.get('#message').textContent, lang === 'pl' ? /przygotowaniu/ : /prepared/);
    t.setResponse(() => ({ ok: true, json: async () => ({ ok: true, model: 'CV02', code: 'DEMO-ONLY' }) }));
    await t.submit();
    assert.equal(t.get('#code').textContent, 'DEMO-ONLY');
    assert.equal(t.get('#result').hidden, false);
    const first = t.calls[0];
    assert.match(first.recovery, /^[A-Za-z0-9_-]{32,100}$/);
    assert.deepEqual(Object.keys(first).sort(), ['model','orderId','purchasedModel','recovery','requestId','turnstile']);
    t.get('input[name="gift"]:checked').value = 'CV05';
    t.setResponse(() => ({ ok: true, json: async () => ({ ok: true, model: 'CV02', code: 'DEMO-ONLY', replayed: true }) }));
    await t.submit();
    assert.equal(first.recovery, t.calls[1].recovery);
    assert.notEqual(first.requestId, t.calls[1].requestId);
    assert.match(t.get('#message').textContent, lang === 'pl' ? /Odzyskano/ : /recovered/);
    assert.equal(t.get('#gift-name').textContent, 'CV02 Split Max');
    for (const error of ['bogo_not_ready','invalid_request','order_not_found','purchase_not_eligible','verification_failed','already_fulfilled','already_claimed','sold_out','temporarily_unavailable','rate_limited','unknown']) {
      t.setResponse(() => ({ ok: false, json: async () => ({ ok: false, error }) }));
      await t.submit();
      assert.ok(t.get('#message').textContent.length > 10);
      assert.equal(t.get('#result').hidden, true);
      assert.equal(t.get('#order').disabled, false);
      assert.equal(t.get('#submit').disabled, true);
    }
    for (const response of [() => { throw Error('network'); }, () => ({ ok: false, json: async () => { throw Error('HTML'); } }), () => ({ ok: true, json: async () => null }), () => ({ ok: false, json: async () => ({ ok: true, model: 'CV02', code: 'DEMO' }) }), () => ({ ok: true, json: async () => ({ ok: true, model: 'CV08', code: 'DEMO' }) })]) {
      t.setResponse(response); await t.submit(); assert.equal(t.get('#result').hidden, true);
    }
    const count = t.calls.length;
    t.get('#order').value = 'bad'; await t.submit(); assert.equal(t.calls.length, count);
    const blocked = await setup(lang); blocked.context.localStorage.setItem = () => { throw Error('blocked'); };
    await blocked.submit(); assert.equal(blocked.calls.length, 0);
    assert.match(blocked.get('#message').textContent, lang === 'pl' ? /zapis danych/ : /store browser data/);
    const reload = await setup(lang, t.storage);
    reload.setResponse(() => ({ ok: false, json: async () => ({ ok: false, error: 'bogo_not_ready' }) }));
    await reload.submit(); assert.equal(reload.calls[0].recovery, first.recovery);
    const pending = await setup(lang); let resolve;
    pending.setResponse(() => new Promise(r => resolve = r));
    const attempt = pending.submit();
    await new Promise(r => setTimeout(r, 20));
    await pending.submit(); assert.equal(pending.calls.length, 1); assert.equal(pending.get('#order').disabled, true);
    resolve({ ok: false, json: async () => ({ ok: false, error: 'bogo_not_ready' }) }); await attempt;
    console.log(lang + ': validation, claim, recovery, errors, storage, duplicate submit PASS');
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
