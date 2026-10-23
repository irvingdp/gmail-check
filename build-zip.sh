#!/bin/sh
# Build the Chrome Web Store upload zip into dist/.
set -e
cd "$(dirname "$0")"
VERSION=$(python3 -c "import json;print(json.load(open('manifest.json'))['version'])")
OUT="dist/gmail-require-to-$VERSION.zip"
mkdir -p dist
TMP=$(mktemp -d)
zip -r -X "$TMP/out.zip" manifest.json content.js content.css _locales \
  icons/icon16.png icons/icon32.png icons/icon48.png icons/icon128.png \
  -x '*.DS_Store'
cat "$TMP/out.zip" > "$OUT"
rm -rf "$TMP"
echo "Built $OUT"
unzip -l "$OUT"
