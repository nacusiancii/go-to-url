#!/usr/bin/env bash
# Re-renders the store screenshots and promo tile from demo.html and the SVGs.
set -euo pipefail
cd "$(dirname "$0")"
for state in list search close; do
  chromium --headless=new --disable-gpu --hide-scrollbars --window-size=1280,800 --virtual-time-budget=3000 \
    --allow-file-access-from-files --screenshot="$PWD/screenshot-$state.png" "file://$PWD/demo.html?state=$state" 2>/dev/null
done
rsvg-convert -w 440 -h 280 promo-small.svg -o promo-small-440x280.png
for s in 32 48 128; do rsvg-convert -w $s -h $s icon.svg -o ../icons/icon$s.png; done
# 16px drops the padding so it stays legible in the toolbar
sed 's/viewBox="0 0 128 128"/viewBox="16 16 96 96"/' icon.svg | rsvg-convert -w 16 -h 16 -o ../icons/icon16.png
# The store wants 24-bit PNGs without transparency
for f in screenshot-*.png promo-small-440x280.png; do magick "$f" -background black -alpha remove -alpha off "PNG24:$f"; done
