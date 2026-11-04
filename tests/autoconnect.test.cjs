const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../onecomme-translate-autoconnect.user.js'), 'utf8');
test('installation metadata points at the standalone public script', () => {
  assert.match(source, /^\/\/ ==UserScript==\r?\n/);
  const header = source.split('// ==/UserScript==')[0];
  const field = name => new RegExp(`^// @${name}\\s+(.+)$`, 'm').exec(header)?.[1].trim();
  assert.match(field('version'), /^\d+\.\d+\.\d+$/);
  assert.equal(field('namespace'), 'https://github.com/dYoshitakaKato/onecomme-translate-autoconnect');
  assert.equal(field('updateURL'), 'https://raw.githubusercontent.com/dYoshitakaKato/onecomme-translate-autoconnect/main/onecomme-translate-autoconnect.user.js');
  assert.equal(field('downloadURL'), field('updateURL'));
  assert.equal(field('grant'), 'none');
});
function fixture(options = {}) {
  let callback, stopped = false, clicks = 0, clickListener;
  const timers = new Map(); let counter = 0;
  const button = {textContent: 'わんコメと接続する', disabled: false, visible: true,
    getAttribute: () => null, getClientRects() { return this.visible ? [{}] : []; },
    click() { clicks++; }, closest: () => button};
  const body = {textContent: '', prepend() {}};
  let buttons = options.delayed ? [] : [button];
  const window = {}; window.top = window; window.self = options.frame ? {} : window;
  const context = {window, location: {origin: 'https://onecomme.com', pathname: '/tools/translate/', ...options.location},
    sessionStorage: {getItem: key => options.storage?.get(key) || null,
      setItem: (key, value) => options.storage?.set(key, value), removeItem: key => options.storage?.delete(key)},
    document: {body, querySelectorAll: () => buttons,
      createElement: () => ({textContent: '', style: {}, setAttribute() {}}),
      addEventListener(_, handler) { clickListener = handler; }, removeEventListener() {}},
    MutationObserver: class { constructor(handler) { callback = handler; } observe() {} disconnect() { stopped = true; } },
    getComputedStyle: () => ({visibility: 'visible'}),
    setTimeout(handler, delay) { timers.set(++counter, {handler, delay}); return counter; },
    clearTimeout(id) { timers.delete(id); }};
  if (options.disabled) button.disabled = true;
  if (options.hidden) button.visible = false;
  if (options.text) button.textContent = options.text;
  vm.runInNewContext(source, context);
  function run(delay) { for (const [id, timer] of [...timers]) if (timer.delay === delay) { timers.delete(id); timer.handler(); } }
  return {button, body, clicks: () => clicks, stopped: () => stopped, again: () => vm.runInNewContext(source, context),
    change() { buttons = [button]; callback?.(); run(100); }, expire: () => run(120000),
    manual() { clickListener({isTrusted: true, target: button}); }};
}

test('delayed React rendering and language setup trigger exactly one connection click', () => {
  const f = fixture({delayed: true, disabled: true});
  assert.equal(f.clicks(), 0); f.change(); assert.equal(f.clicks(), 0);
  f.button.disabled = false; f.change(); assert.equal(f.clicks(), 1);
  f.change(); f.again(); assert.equal(f.clicks(), 1);
  f.body.textContent = '⚡ 接続済み：翻訳待機中'; f.change(); assert.equal(f.stopped(), true);
});

test('hidden buttons, similar text, other pages and frames are never clicked', () => {
  for (const options of [{hidden: true}, {text: 'わんコメと接続する（停止）'}, {frame: true},
    {location: {origin: 'https://example.com'}}, {location: {pathname: '/tools/translate-other'}}]) {
    const f = fixture(options); f.change(); assert.equal(f.clicks(), 0);
  }
});

test('initialization failures do not cause repeated clicks or page reloads', () => {
  const f = fixture(); assert.equal(f.clicks(), 1);
  f.body.textContent = '初期化に失敗しました'; f.change(); f.expire();
  assert.equal(f.clicks(), 1); assert.equal(f.stopped(), true);
});

test('reload after an unconfirmed automatic attempt leaves the button for manual setup', () => {
  const storage = new Map();
  const first = fixture({storage}); assert.equal(first.clicks(), 1);
  const reloaded = fixture({storage}); reloaded.change(); assert.equal(reloaded.clicks(), 0);
  const next = fixture({storage}); assert.equal(next.clicks(), 1);
});

test('a manual click cancels automation before a delayed observer can click again', () => {
  const f = fixture({delayed: true}); f.manual(); f.change(); assert.equal(f.clicks(), 0);
});
