#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$PROJECT_DIR/dist"
PORT="${PORT:-3000}"
METADATA_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

cd "$PROJECT_DIR"
/usr/bin/time -p mkdir -p "$OUTPUT_DIR" "$METADATA_DIR"
# This project is dependency-free static HTML/CSS/JS; copying these sources is its build step.
/usr/bin/time -p cp index.html app.js styles.css "$OUTPUT_DIR/"
/usr/bin/time -p node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({project:process.argv[2],directory:process.argv[3]}))' \
  "$METADATA_DIR/deployment-output.json" "$PROJECT_DIR" "$OUTPUT_DIR"

export OUTPUT_DIR PORT
/usr/bin/time -p node --input-type=commonjs <<'NODE'
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const root = path.resolve(process.env.OUTPUT_DIR);
const mime = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400).end('Bad request'); return; }
  const file = path.resolve(root, '.' + pathname);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
  let target = file;
  try { if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html'); }
  catch { res.writeHead(404).end('Not found'); return; }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});
server.listen(Number(process.env.PORT), '0.0.0.0', () => console.log(`Aurora Citadel serving ${root} on port ${process.env.PORT}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
NODE