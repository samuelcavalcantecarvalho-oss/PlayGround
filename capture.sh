#!/usr/bin/env bash
set -euo pipefail
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an evidence directory outside the project}"
/usr/bin/time -p node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/capture.mjs"
