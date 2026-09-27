#!/bin/sh
# Bundles the app into one self-contained HTML file (for hosting as a claude.ai Artifact).
# Usage: sh build-artifact.sh [output-file]
set -e
cd "$(dirname "$0")"
out="${1:-dist/campaign-keeper.html}"
mkdir -p "$(dirname "$out")"
{
  echo '<title>MotW Campaign Keeper</title>'
  grep 'fonts.googleapis.com/css2' index.html
  echo '<style>'; cat app/styles.css; echo '</style>'
  sed -n '/<aside id="sidebar">/,/<main id="main"><\/main>/p' index.html
  for f in templates sample app; do echo '<script>'; cat "app/$f.js"; echo '</script>'; done
} > "$out"
echo "Built $out"
