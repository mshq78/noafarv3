#!/usr/bin/env bash
# Dump the database to deploy/backups/ and keep the last 14. Add to cron, e.g.:
#   0 3 * * * /root/noafarv3/deploy/backup.sh
set -euo pipefail
cd "$(dirname "$0")"
if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
mkdir -p backups
f="backups/noafar-$(date +%Y%m%d-%H%M).sql.gz"
$DC exec -T db pg_dump -U noafar noafar | gzip > "$f"
ls -1t backups/*.sql.gz | tail -n +15 | xargs -r rm --
echo "saved $f"
