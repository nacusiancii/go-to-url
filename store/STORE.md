# Chrome Web Store listing — Go to URL

Copy each section into the matching field in the Developer Dashboard.

## Package
Run `./package.sh` from the repo root, then upload `dist/go-to-url-1.0.0.zip`.

## Store listing tab

**Name** (taken from the manifest): Go to URL: Fullscreen Address Bar & Tab Switcher

**Summary** (taken from the manifest): Chrome in fullscreen (F11) hides the address bar. Press Alt+G: type an address or search, switch tabs. You never leave fullscreen.

**Category:** Tools (or Workflow & Planning)

**Language:** English

**Description:** paste the contents of `description.txt` as is. It's plain text, which is what the store expects.

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
