# Chrome Web Store listing — Go to URL

Copy each section into the matching field in the Developer Dashboard.

## Package
Run `./package.sh` from the repo root, then upload `dist/go-to-url-1.0.0.zip`.

## Store listing tab

**Name** (taken from the manifest): Go to URL — address bar & tab switcher

**Summary** (taken from the manifest): Alt+G: type a URL, search, or switch, close and reopen tabs — even in fullscreen, where the address bar is hidden.

**Category:** Tools (or Workflow & Planning)

**Language:** English

**Description:**

In fullscreen, Chrome hides the address bar and the tab strip. Go to URL brings both back as one keyboard prompt, without leaving fullscreen.

Press Alt+G and type:
• An address, like example.com or localhost:3000. Enter opens it.
• Anything else, and it's searched with your default search engine.
• Part of a tab's title or address, and the matching tabs appear underneath.

Same keys as Chrome's address bar:
• Enter: open in this tab
• Alt+Enter: open in a new tab
• Shift+Enter: open in a new window

Tab switcher:
• Every tab is labeled with the Ctrl+number Chrome already uses for it (⌘ on Mac), so you learn the shortcuts as you go.
• ↑ ↓ and Enter switch to any tab, including the ones past the 8th.
• Del closes the selected tab. Ctrl+Z reopens it, with its history, in the same spot.

Hints at the bottom of the prompt always show what Enter will do. Hold Alt or Shift to see the highlight move.

You can change the Alt+G shortcut at chrome://extensions/shortcuts.

Private by design: no data collection, no network requests, no analytics.

**Graphic assets:**
- Store icon: `../icons/icon128.png`
- Screenshots (1280×800): `screenshot-list.png`, `screenshot-search.png`, `screenshot-close.png`
- Small promo tile (440×280): `promo-small-440x280.png`

## Privacy practices tab

**Single purpose:**
A keyboard prompt (Alt+G) for opening addresses, searching and switching tabs, so you can navigate without the address bar, for example in fullscreen.

**Permission justifications:**
- **activeTab:** Draws the prompt over the current page, only when you press the extension's shortcut.
- **scripting:** Injects the prompt's interface into the current tab when you press the shortcut (used together with activeTab, so there's no access to any site the rest of the time).
- **tabs:** Reads tab titles and addresses to list, filter and switch between your open tabs in the prompt.
- **sessions:** Reopens a tab you closed from the prompt (undo), restoring its history, using Chrome's recently-closed list.
- **search:** Sends text that isn't an address to your default search engine, like the address bar does.
- **favicon:** Shows each tab's site icon in the tab list.

**Remote code:** No, I am not using remote code.

**Data usage:** Leave every data-type box unchecked. The extension collects nothing. Then tick all three certifications (no selling data to third parties, no use unrelated to the single purpose, no use for creditworthiness or lending).

**Privacy policy URL:** https://github.com/nacusiancii/go-to-url/blob/main/PRIVACY.md

## Distribution tab
Visibility: Public (or Unlisted to share a link first). Regions: all.
