#!/usr/bin/env bash
# Pull the latest code and restart. Run as root from deploy/.
set -euo pipefail
cd "$(dirname "$0")"
git -C .. pull --ff-only
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
$DC up -d --build
$DC ps
