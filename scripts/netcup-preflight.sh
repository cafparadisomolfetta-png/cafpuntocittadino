#!/usr/bin/env bash
# Local-only preflight for the already purchased Netcup host; no DNS or secrets changed.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v docker >/dev/null || { echo "Docker assente"; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose assente"; exit 1; }
docker compose -f compose.netcup.staging.yaml config --quiet
echo "Configurazione Compose valida"
echo "Verifico che la porta staging 18080 non sia occupata..."
if command -v ss >/dev/null && ss -ltn '( sport = :18080 )' | grep -q ':18080'; then
  echo "Porta 18080 occupata: non avvio né sostituisco altri servizi."
  exit 1
fi
echo "Pronto per collaudo locale: docker compose -f compose.netcup.staging.yaml up -d --build"
echo "Verifica: curl -fsS http://127.0.0.1:18080/healthz"
echo "Nessun deploy eseguito da questo controllo."
