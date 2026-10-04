#!/usr/bin/env bash
# Builds the Chrome Web Store upload: just the extension files, no docs or store assets.
set -euo pipefail
cd "$(dirname "$0")"
version=$(node -p 'require("./manifest.json").version')
mkdir -p dist
rm -f "dist/go-to-url-$version.zip"
zip -X -r "dist/go-to-url-$version.zip" manifest.json background.js ui.js url.js goto.html icons/
echo "dist/go-to-url-$version.zip"
