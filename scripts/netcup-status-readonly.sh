#!/usr/bin/env bash
# Read-only Netcup inventory. Does not print secrets, change files, or restart services.
set -u
printf '\n== Host and time ==\n'
hostname
date -Is
printf '\n== Project directories ==\n'
for d in /opt/cafpuntocittadino /var/www /opt /var/tmp; do
  if [ -d "$d" ]; then
    printf '%s exists\n' "$d"
  fi
done
if [ -d /opt/cafpuntocittadino/.git ]; then
  printf '\n== Existing project Git (no fetch/pull) ==\n'
  git -C /opt/cafpuntocittadino rev-parse --abbrev-ref HEAD 2>/dev/null || true
  git -C /opt/cafpuntocittadino rev-parse --short HEAD 2>/dev/null || true
  git -C /opt/cafpuntocittadino status --porcelain --untracked-files=no 2>/dev/null | head -20
fi
printf '\n== Service status (names only) ==\n'
if command -v systemctl >/dev/null; then
  systemctl list-units --type=service --state=running --no-legend --plain 2>/dev/null | awk '{print $1}' | grep -E '^(nginx|apache2|caddy|docker|containerd|postgresql|punto|caf|node)' || true
fi
printf '\n== Local HTTP response codes ==\n'
if command -v curl >/dev/null; then
  for p in 80 443 8080 18080; do
    code=$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 3 "http://127.0.0.1:$p/" 2>/dev/null || true)
    printf 'localhost:%s HTTP %s\n' "$p" "${code:-unreachable}"
  done
fi
printf '\n== Docker containers (names/status only) ==\n'
if command -v docker >/dev/null; then
  docker ps --format '{{.Names}} | {{.Status}}' 2>/dev/null || true
fi
printf '\nRead-only check complete. No credentials shown intentionally.\n'
