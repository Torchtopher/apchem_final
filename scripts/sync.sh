#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-root@104.236.37.133}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/apchem}"
BUILD_DIR="${BUILD_DIR:-dist}"

echo "Building app..."
npm run build

echo "Preparing ${REMOTE_HOST}:${REMOTE_PATH}..."
ssh "$REMOTE_HOST" "mkdir -p '$REMOTE_PATH'"

echo "Syncing ${BUILD_DIR}/ to ${REMOTE_HOST}:${REMOTE_PATH}/..."
rsync -avz --delete "${BUILD_DIR}/" "${REMOTE_HOST}:${REMOTE_PATH}/"

echo "Done."
