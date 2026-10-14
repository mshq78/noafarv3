#!/usr/bin/env bash
# One-time setup on a fresh Ubuntu server. Run as root from the repo's deploy/ folder:
#   cd deploy && sudo bash setup.sh
set -euo pipefail
cd "$(dirname "$0")"

say() { printf '\n== %s\n' "$*"; }

say "Installing Docker"
if ! command -v docker >/dev/null; then
  apt-get update -y
  apt-get install -y docker.io ca-certificates curl openssl
  systemctl enable --now docker
fi

# Docker Hub is often unreachable from Iran; pull through a mirror.
say "Configuring a registry mirror"
mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
  cat > /etc/docker/daemon.json <<'J'
{ "registry-mirrors": ["https://docker.arvancloud.ir"] }
J
  systemctl restart docker
fi

say "Finding docker compose"
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null; then
  DC="docker-compose"
else
  apt-get install -y docker-compose-v2 2>/dev/null || apt-get install -y docker-compose
  if docker compose version >/dev/null 2>&1; then DC="docker compose"; else DC="docker-compose"; fi
fi
echo "using: $DC"

if [ ! -f .env ]; then
  say "Creating .env"
  cp .env.example .env
  chmod 600 .env
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
  sed -i "s|^SESSION_SECRET=.*|SESSION_SECRET=$(openssl rand -hex 48)|" .env
  read -r -p "Admin email(s), comma separated: " ADMINS
  sed -i "s|^BOOTSTRAP_ADMIN_EMAILS=.*|BOOTSTRAP_ADMIN_EMAILS=${ADMINS}|" .env
  read -r -p "Domain to serve (':80' to test over the IP first) [:80]: " DOM
  DOM="${DOM:-:80}"
  sed -i "s|^DOMAIN=.*|DOMAIN=${DOM}|" .env
  case "$DOM" in :*) sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=|" .env ;; esac
fi

say "Building and starting (the first build takes a few minutes)"
$DC up -d --build

say "Loading the content"
for i in $(seq 1 30); do
  if $DC exec -T app node dist-server/seed.js --client --yes; then break; fi
  sleep 3
done

say "Done"
$DC ps
echo "Open the server's IP in a browser. Secrets are in deploy/.env (not printed)."
