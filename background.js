importScripts("url.js");

const OWN_PAGE = chrome.runtime.getURL("goto.html");

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "open-prompt" || !tab) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["url.js", "ui.js"] });
  } catch {
    // chrome:// pages, the Web Store, etc. don't allow injection. Use our own page instead:
    // replace a new-tab page in place, otherwise open the prompt in a tab next to it.
    if (/^chrome:\/\/(newtab|new-tab-page)/.test(tab.url || tab.pendingUrl || "")) {
      chrome.tabs.update(tab.id, { url: OWN_PAGE });
    } else {
      chrome.tabs.create({ url: OWN_PAGE, index: tab.index + 1 });
    }
  }
});

// Tabs in the prompt's window, with the number key Chrome uses for each
// (Ctrl/⌘ + 1..8 for the first eight, 9 for the last).
async function listTabs(senderTab) {
  const tabs = await chrome.tabs.query({ windowId: senderTab.windowId });
  const last = tabs.length - 1;
  return tabs
    .filter((t) => !t.url?.startsWith(OWN_PAGE))
    .map((t) => ({
      id: t.id,
      title: t.title || t.url || "",
      url: t.url || t.pendingUrl || "",
      active: t.id === senderTab.id,
      position: t.index + 1,
      shortcut: t.index < 8 ? t.index + 1 : t.index === last ? 9 : null,
    }));
}

// Closing goes through Chrome's own recently-closed list, so undo brings the tab back
// with its history, in its old spot. Ctrl+Shift+T would restore it the same way.
async function closeTab(tabId, senderTab) {
  await chrome.tabs.remove(tabId);
  const [entry] = await chrome.sessions.getRecentlyClosed({ maxResults: 1 });
  return { sessionId: entry?.tab?.sessionId, tabs: await listTabs(senderTab) };
}

async function reopenTab(sessionId, senderTab) {
  if (sessionId) await chrome.sessions.restore(sessionId);
  // Restoring makes the tab active; stay on the tab the prompt is open in.
  await chrome.tabs.update(senderTab.id, { active: true });
  return { tabs: await listTabs(senderTab) };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tab = sender.tab;
  if (!tab) return;
  const fromOwnPage = tab.url?.startsWith(OWN_PAGE);

  if (msg.type === "tabs") {
    listTabs(tab).then(sendResponse);
    return true; // keep the channel open for the async response
  }
  if (msg.type === "closeTab") {
    closeTab(msg.tabId, tab).then(sendResponse);
    return true;
  }
  if (msg.type === "reopenTab") {
    reopenTab(msg.sessionId, tab).then(sendResponse);
    return true;
  }
  if (msg.type === "close") {
    chrome.tabs.remove(tab.id);
    return;
  }
  if (msg.type === "switch") {
    chrome.tabs.update(msg.tabId, { active: true });
    if (fromOwnPage) chrome.tabs.remove(tab.id);
    return;
  }
  if (msg.type !== "go") return;
  // Same as Chrome's address bar: Enter = this tab, Alt+Enter = new tab, Shift+Enter = new window.
  const url = toUrl(msg.input);
  if (!url) {
    const disposition = { tab: "CURRENT_TAB", newTab: "NEW_TAB", newWindow: "NEW_WINDOW" }[msg.target];
    chrome.search.query({ text: msg.input, disposition });
  } else if (msg.target === "newTab") {
    chrome.tabs.create({ url, index: tab.index + 1 });
  } else if (msg.target === "newWindow") {
    chrome.windows.create({ url });
  } else {
    chrome.tabs.update(tab.id, { url });
  }
});
