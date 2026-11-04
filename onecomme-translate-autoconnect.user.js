// ==UserScript==
// @name         わんコメ翻訳 自動接続
// @namespace    https://github.com/dYoshitakaKato/onecomme-translate-autoconnect
// @version      1.0.1
// @description  公式翻訳ページの接続ボタンを一度だけ押します。
// @match        https://onecomme.com/tools/translate*
// @run-at       document-idle
// @grant        none
// @noframes
// @homepageURL  https://github.com/dYoshitakaKato/onecomme-translate-autoconnect
// @supportURL   https://github.com/dYoshitakaKato/onecomme-translate-autoconnect/issues
// @license      MIT
// @updateURL    https://raw.githubusercontent.com/dYoshitakaKato/onecomme-translate-autoconnect/main/onecomme-translate-autoconnect.user.js
// @downloadURL  https://raw.githubusercontent.com/dYoshitakaKato/onecomme-translate-autoconnect/main/onecomme-translate-autoconnect.user.js
// ==/UserScript==

(() => {
  'use strict';
  if (window.top !== window.self || location.origin !== 'https://onecomme.com'
      || !/^\/tools\/translate\/?$/.test(location.pathname) || window.streamAssistantTranslateAutoconnect) return;
  window.streamAssistantTranslateAutoconnect = true;
  const storageKey = 'stream-assistant-translate-connect-pending';
  let attempted = false, queued = null, finished = false, notice = null;
  const text = button => button.textContent.replace(/\s+/g, ' ').trim();
  function inform(message) {
    if (!notice) {
      notice = document.createElement('p');
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'padding:12px 16px;margin:12px;border:1px solid #789;border-radius:8px;font:14px/1.6 sans-serif';
      document.body.prepend(notice);
    }
    if (notice.textContent !== message) notice.textContent = message;
  }
  function stop() {
    finished = true;
    observer.disconnect(); clearTimeout(deadline); clearTimeout(queued);
    document.removeEventListener('click', manualClick, true);
  }
  function manualClick(event) {
    const button = event.target.closest?.('button');
    if (event.isTrusted && button && text(button) === 'わんコメと接続する') {
      sessionStorage.removeItem(storageKey);
      inform('手動で接続しています。以降の接続状態は翻訳ページの表示で確認できます。');
      stop();
    }
  }
  function connect() {
    queued = null;
    if (finished) return;
    if (document.body.textContent.includes('接続済み：翻訳待機中')) {
      sessionStorage.removeItem(storageKey);
      inform('わんコメ接続済み：翻訳待機中です。'); stop(); return;
    }
    if (attempted) return;
    const button = [...document.querySelectorAll('button')].find(button => text(button) === 'わんコメと接続する');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true'
        || !button.getClientRects().length || getComputedStyle(button).visibility === 'hidden') return;
    attempted = true;
    try { sessionStorage.setItem(storageKey, 'pending'); }
    catch { inform('自動接続の状態を保存できないため、手動で「わんコメと接続する」を押してください。'); stop(); return; }
    inform('わんコメへ自動接続しています。初回のモデル準備・権限確認で失敗した場合は、ページを再読み込みしてください。次の読込では手動で接続できます。');
    button.click();
  }
  try {
    if (sessionStorage.getItem(storageKey) === 'pending') {
      sessionStorage.removeItem(storageKey);
      inform('前回の自動接続の完了を確認できなかったため、今回は手動接続です。「わんコメと接続する」を押し、モデル準備・権限確認を完了してください。');
      return;
    }
  } catch {
    inform('自動接続の状態を保存できないため、手動で「わんコメと接続する」を押してください。');
    return;
  }
  const observer = new MutationObserver(() => {
    if (!finished && queued === null) queued = setTimeout(connect, 100);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['disabled', 'aria-disabled', 'hidden', 'style', 'class'] });
  document.addEventListener('click', manualClick, true);
  const deadline = setTimeout(() => {
    inform(attempted ? '自動接続を試しました。翻訳ページの接続状態を確認してください。初期化に失敗した場合は、ページを再読み込みして手動で接続してください。'
      : '自動接続を待機しました。翻訳先の言語・モデルを設定し、ページを再読み込みするか手動で接続してください。');
    stop();
  }, 120000);
  connect();
})();
