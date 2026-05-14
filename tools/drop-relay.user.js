// ==UserScript==
// @name         Lifestyle — Discord drop relay
// @namespace    com.lifestyle.discord-relay
// @version      0.1.0
// @description  Forwards new messages from a specific Discord channel to your Supabase Edge Function so the scheduled agent can parse them into calendar events.
// @match        https://discord.com/channels/*
// @match        https://*.discord.com/channels/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @connect      dswetxilqyzvrgocqobf.supabase.co
// ==/UserScript==

(function () {
  'use strict';

  // ── CONFIG — EDIT THESE BEFORE SAVING ────────────────────────────────────
  const INGEST_URL = 'https://dswetxilqyzvrgocqobf.supabase.co/functions/v1/discord-raw-ingest';
  const TARGET_CHANNEL_ID = '1040469091678429254';        // Right-click channel → Copy Channel ID (Developer Mode on)
  const INGEST_SECRET = 'ba25801dd700dda629b7263da1788e10d9d2c2772523fb62f9bbccdbb893e012';   // The Supabase secret you generated

  // ── State ─────────────────────────────────────────────────────────────────
  const CURSOR_KEY = `dropRelay:lastSeen:${TARGET_CHANNEL_ID}`;
  let cursor = GM_getValue(CURSOR_KEY, null);
  let observer = null;
  let watchedListEl = null;

  GM_registerMenuCommand('Drop relay — reset cursor', () => {
    GM_setValue(CURSOR_KEY, null);
    cursor = null;
    console.log('[drop-relay] cursor reset; next batch will be treated as new');
  });
  GM_registerMenuCommand('Drop relay — show current cursor', () => {
    console.log('[drop-relay] cursor =', cursor);
    alert('Drop relay cursor: ' + (cursor ?? 'none'));
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  function currentRouteIds() {
    const m = location.pathname.match(/^\/channels\/([^/]+)\/([^/]+)/);
    return m ? { guildId: m[1], channelId: m[2] } : { guildId: null, channelId: null };
  }

  function isBigger(a, b) {
    if (!b) return true;
    try { return BigInt(a) > BigInt(b); } catch { return false; }
  }

  function extractMessage(li) {
    const ariaId = li.getAttribute('data-list-item-id') || li.id || '';
    const match = ariaId.match(/(?:chat-messages___|chat-messages-[^-]+-)(\d+)/);
    const messageId = match ? match[1] : null;
    if (!messageId) return null;

    // Skip system messages (joins, pins, calls). They lack the content div.
    const contentEl = li.querySelector('[id^="message-content-"]');
    if (!contentEl) return null;
    const content = (contentEl.innerText || '').trim();
    if (!content) return null;

    const timeEl = li.querySelector('time[datetime]');
    const timestamp = timeEl ? timeEl.getAttribute('datetime') : null;

    const usernameEl = li.querySelector('[id^="message-username-"]');
    const authorName = usernameEl ? usernameEl.innerText.trim() : null;

    const { guildId, channelId } = currentRouteIds();
    const jumpUrl = guildId && channelId
      ? `https://discord.com/channels/${guildId}/${channelId}/${messageId}`
      : null;

    return { messageId, content, timestamp, authorName, channelId, jumpUrl };
  }

  function postToIngest(msg) {
    GM_xmlhttpRequest({
      method: 'POST',
      url: INGEST_URL,
      headers: {
        'Authorization': `Bearer ${INGEST_SECRET}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify(msg),
      onload: (res) => {
        if (res.status >= 200 && res.status < 300) {
          console.log('[drop-relay] ingest ok:', msg.messageId, res.responseText);
        } else {
          console.warn('[drop-relay] ingest failed:', msg.messageId, res.status, res.responseText);
        }
      },
      onerror: (err) => {
        console.warn('[drop-relay] ingest network error:', msg.messageId, err);
      },
    });
  }

  function processNewMessages(addedNodes) {
    const toForward = [];
    for (const node of addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      const lis = node.matches?.('li[data-list-item-id]')
        ? [node]
        : Array.from(node.querySelectorAll?.('li[data-list-item-id]') || []);
      for (const li of lis) {
        const msg = extractMessage(li);
        if (!msg) continue;
        if (isBigger(msg.messageId, cursor)) toForward.push(msg);
      }
    }
    if (toForward.length === 0) return;
    toForward.sort((a, b) => (BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1));
    for (const m of toForward) postToIngest(m);
    const newCursor = toForward[toForward.length - 1].messageId;
    cursor = newCursor;
    GM_setValue(CURSOR_KEY, newCursor);
  }

  function seedCursorFromVisible(listEl) {
    if (cursor) return;
    let highest = null;
    const lis = listEl.querySelectorAll('li[data-list-item-id]');
    for (const li of lis) {
      const msg = extractMessage(li);
      if (msg && isBigger(msg.messageId, highest)) highest = msg.messageId;
    }
    if (highest) {
      cursor = highest;
      GM_setValue(CURSOR_KEY, highest);
      console.log('[drop-relay] seeded cursor:', highest);
    }
  }

  function attachObserver() {
    const { channelId } = currentRouteIds();
    if (channelId !== TARGET_CHANNEL_ID) {
      detachObserver();
      return;
    }
    const listEl = document.querySelector('[data-list-id="chat-messages"]');
    if (!listEl || listEl === watchedListEl) return;

    detachObserver();
    watchedListEl = listEl;
    seedCursorFromVisible(listEl);

    observer = new MutationObserver((mutations) => {
      const added = [];
      for (const m of mutations) for (const n of m.addedNodes) added.push(n);
      if (added.length) processNewMessages(added);
    });
    observer.observe(listEl, { childList: true, subtree: true });
    console.log('[drop-relay] observer attached to channel', TARGET_CHANNEL_ID);
  }

  function detachObserver() {
    if (observer) observer.disconnect();
    observer = null;
    watchedListEl = null;
  }

  // Discord is a SPA — re-attach when URL changes or the message list remounts.
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      attachObserver();
    } else if (currentRouteIds().channelId === TARGET_CHANNEL_ID && !observer) {
      attachObserver();
    }
  }, 1000);

  attachObserver();
})();
