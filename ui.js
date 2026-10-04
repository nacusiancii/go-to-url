(() => {
  const HOST_ID = "__goto-url-prompt__";
  const onOwnPage = location.protocol === "chrome-extension:";
  // Key names as Chrome uses them on this platform: Ctrl+1 / Alt+Enter, or ⌘1 / ⌥Enter on a Mac.
  const isMac = /mac/i.test(navigator.userAgentData?.platform || navigator.platform);
  const keys = isMac
    ? { mod: "⌘", alt: "⌥", shift: "⇧", reopen: "⌘⇧T" }
    : { mod: "Ctrl+", alt: "Alt+", shift: "Shift+", reopen: "Ctrl+Shift+T" };

  // Pressing Alt+G again closes the prompt.
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    existing.remove();
    return;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "all:initial;position:fixed;inset:0;z-index:2147483647";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `
    <style>
      .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.35); }
      .box {
        position: fixed; top: 14vh; left: 50%; transform: translateX(-50%);
        width: min(680px, calc(100vw - 32px)); box-sizing: border-box;
        background: #1f1f23; color: #eee; border: 1px solid #3a3a40; border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,.5); padding: 14px;
        font: 14px/1.4 system-ui, sans-serif;
      }
      input {
        width: 100%; box-sizing: border-box; padding: 10px 12px; font: inherit; font-size: 16px;
        color: inherit; background: #131316; border: 1px solid #44444b; border-radius: 8px; outline: none;
      }
      input:focus { border-color: #7c9cff; }
      .list { margin-top: 8px; max-height: 50vh; overflow-y: auto; }
      .list:empty { display: none; }
      .row {
        display: flex; align-items: center; gap: 10px; padding: 6px 8px;
        border-radius: 6px; cursor: pointer; min-width: 0;
      }
      .row.selected { background: #26304d; }
      .badge {
        flex: none; width: 52px; text-align: center; font: 11px ui-monospace, monospace;
        background: #2b2b31; border: 1px solid #44444b; border-radius: 4px; padding: 1px 0; color: #ddd;
      }
      .badge.none { background: none; border-color: transparent; color: #666; }
      .icon { flex: none; width: 16px; height: 16px; }
      .title { flex: 1 1 auto; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .host { flex: 0 1 auto; max-width: 35%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #888; font-size: 12px; }
      .current { flex: none; font-size: 11px; color: #7c9cff; }
      .go .badge { color: #7c9cff; }
      .hints { display: flex; flex-wrap: wrap; gap: 2px; margin-top: 10px; font-size: 12px; }
      .hint {
        display: flex; align-items: center; gap: 5px; padding: 4px 6px;
        border: 1px solid transparent; border-radius: 6px; color: #999;
        transition: background .1s, color .1s, border-color .1s;
      }
      .hint.active { background: #26304d; border-color: #7c9cff; color: #fff; }
      .hint[hidden] { display: none; }
      .hint.esc { margin-left: auto; }
      .hint.undo { color: #e7c07b; }
      .undo-text { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      kbd { font: 11px ui-monospace, monospace; background: #2b2b31; border: 1px solid #44444b; border-radius: 4px; padding: 1px 5px; color: #ddd; }
    </style>
    <div class="backdrop"></div>
    <div class="box">
      <input type="text" placeholder="Type a URL, search, or find a tab" spellcheck="false" autocomplete="off">
      <div class="list"></div>
      <div class="hints">
        <span class="hint" data-target="tab"><kbd>Enter</kbd> this tab</span>
        <span class="hint" data-target="newTab"><kbd>${keys.alt}Enter</kbd> new tab</span>
        <span class="hint" data-target="newWindow"><kbd>${keys.shift}Enter</kbd> new window</span>
        <span class="hint" data-target="switch"><kbd>Enter</kbd> switch to tab</span>
        <span class="hint" data-hint="close"><kbd>Del</kbd> <span class="close-text">close tab</span></span>
        <span class="hint undo" data-hint="undo" hidden><kbd>${keys.mod}Z</kbd> <span class="undo-text"></span></span>
        <span class="hint"><kbd>↑↓</kbd> pick</span>
        <span class="hint esc"><kbd>Esc</kbd> close</span>
      </div>
    </div>`;

  const input = root.querySelector("input");
  const list = root.querySelector(".list");
  const hints = root.querySelectorAll(".hint[data-target]");
  const closeHint = root.querySelector('[data-hint="close"]');
  const undoHint = root.querySelector('[data-hint="undo"]');

  let tabs = [];
  let rows = []; // { kind: "go" } or { kind: "tab", tab }
  let selected = 0;
  let modifiers = {};
  const closed = []; // tabs closed from this prompt, newest last: { sessionId, title }
  let busy = false; // a close/reopen is in flight; ignore repeats until the list refreshes

  chrome.runtime.sendMessage({ type: "tabs" }).then((result) => {
    tabs = result || [];
    update();
  });

  // Every word typed must appear in the tab's title or address.
  const matches = (tab, words) => {
    const haystack = (tab.title + " " + tab.url).toLowerCase();
    return words.every((w) => haystack.includes(w));
  };

  // keepSelection: the tab list changed under us (close/undo) — stay on the same row.
  function update(keepSelection) {
    const text = input.value.trim();
    if (text) {
      const words = text.toLowerCase().split(/\s+/);
      rows = [{ kind: "go" }, ...tabs.filter((t) => matches(t, words)).map((tab) => ({ kind: "tab", tab }))];
    } else {
      rows = tabs.map((tab) => ({ kind: "tab", tab }));
    }
    if (keepSelection === true) selected = Math.min(selected, rows.length - 1);
    else selected = text ? 0 : Math.max(0, rows.findIndex((r) => r.tab.active));
    render();
  }

  async function whileBusy(action) {
    busy = true;
    try {
      await action();
    } finally {
      busy = false;
    }
  }

  async function closeSelected() {
    const row = rows[selected];
    // Closing the tab we live in takes the prompt with it, so Ctrl+Z can't work here;
    // Chrome's Ctrl+Shift+T brings it back instead.
    if (row.tab.active) {
      host.remove();
      chrome.runtime.sendMessage({ type: "close" });
      return;
    }
    const result = await chrome.runtime.sendMessage({ type: "closeTab", tabId: row.tab.id });
    closed.push({ sessionId: result.sessionId, title: row.tab.title });
    tabs = result.tabs;
    update(true);
  }

  async function reopenLast() {
    const { sessionId } = closed.pop();
    const result = await chrome.runtime.sendMessage({ type: "reopenTab", sessionId });
    tabs = result.tabs;
    update(true);
    input.focus();
  }

  function hostOf(url) {
    try {
      return new URL(url).host || url;
    } catch {
      return url;
    }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function render() {
    list.replaceChildren(
      ...rows.map((row, i) => {
        const node = el("div", "row" + (row.kind === "go" ? " go" : "") + (i === selected ? " selected" : ""));
        if (row.kind === "go") {
          const text = input.value.trim();
          const url = toUrl(text);
          node.append(el("span", "badge", "→"), el("span", "title", url ? `Go to ${url}` : `Search for “${text}”`));
        } else {
          const { tab } = row;
          const badge = tab.shortcut
            ? el("span", "badge", keys.mod + tab.shortcut)
            : el("span", "badge none", `tab ${tab.position}`);
          const icon = el("img", "icon");
          icon.src = chrome.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=32`);
          icon.onerror = () => (icon.style.visibility = "hidden");
          node.append(badge, icon, el("span", "title", tab.title), el("span", "host", hostOf(tab.url)));
          if (tab.active) node.append(el("span", "current", "current"));
        }
        node.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the input
        node.addEventListener("click", (e) => {
          selected = i;
          activate(e);
        });
        return node;
      })
    );
    list.children[selected]?.scrollIntoView({ block: "nearest" });
    renderHints();
  }

  // The hints show what Enter will do; holding Alt or Shift moves the highlight, like Chrome's address bar.
  const targetFor = (e) => (e.altKey ? "newTab" : e.shiftKey ? "newWindow" : "tab");

  function renderHints() {
    const onTab = rows[selected]?.kind === "tab";
    const target = onTab ? "switch" : targetFor(modifiers);
    for (const h of hints) {
      h.hidden = onTab ? h.dataset.target !== "switch" : h.dataset.target === "switch";
      h.classList.toggle("active", h.dataset.target === target);
    }
    closeHint.hidden = !onTab;
    if (onTab) {
      closeHint.querySelector(".close-text").textContent = rows[selected].tab.active
        ? `close this tab (${keys.reopen} reopens)`
        : "close tab";
    }
    undoHint.hidden = !closed.length;
    if (closed.length) undoHint.querySelector(".undo-text").textContent = `reopen “${closed.at(-1).title}”`;
  }

  function close() {
    host.remove();
    if (onOwnPage) chrome.runtime.sendMessage({ type: "close" });
  }

  function activate(e) {
    const row = rows[selected];
    if (!row) return;
    if (row.kind === "tab") {
      if (row.tab.active) return close();
      chrome.runtime.sendMessage({ type: "switch", tabId: row.tab.id });
    } else {
      chrome.runtime.sendMessage({ type: "go", input: input.value.trim(), target: targetFor(e) });
    }
    host.remove();
  }

  // Delete still deletes text while the cursor has text after it.
  function canCloseSelected() {
    const row = rows[selected];
    const caretAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
    return row?.kind === "tab" && caretAtEnd;
  }

  function move(delta) {
    if (!rows.length) return;
    selected = (selected + delta + rows.length) % rows.length;
    render();
  }

  root.querySelector(".backdrop").addEventListener("click", close);
  input.addEventListener("input", update);
  input.addEventListener("keydown", (e) => {
    e.stopPropagation(); // keep the page's own shortcuts from firing while typing
    modifiers = e;
    renderHints();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate(e);
    } else if (e.key === "Delete" && canCloseSelected()) {
      e.preventDefault();
      if (!busy) whileBusy(closeSelected);
    } else if (e.key.toLowerCase() === "z" && (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && closed.length) {
      e.preventDefault(); // otherwise Ctrl+Z is the input's own text undo
      if (!busy) whileBusy(reopenLast);
    }
  }, true);
  input.addEventListener("keyup", (e) => {
    e.stopPropagation();
    modifiers = e;
    renderHints();
  }, true);
  input.addEventListener("keypress", (e) => e.stopPropagation(), true);
  // Releasing a modifier outside the box would otherwise leave its hint lit.
  input.addEventListener("blur", () => {
    modifiers = {};
    renderHints();
  });

  (document.body || document.documentElement).appendChild(host);
  input.focus();
  renderHints();
})();
