#!/usr/bin/env bash
# Ažuriranje dev servera na poslednju verziju grane dev: git pull, build svih delova, pm2 restart.
#   bash /srv/studio27/deploy/dev/azuriraj.sh            # sve
#   bash /srv/studio27/deploy/dev/azuriraj.sh client     # samo neki deo: server, client, admin, webapp
set -euo pipefail

KOREN="${STUDIO27_KOREN:-/srv/studio27}"
DELOVI=("$@")
[[ ${#DELOVI[@]} -eq 0 ]] && DELOVI=(server client admin webapp)

# fajlovi koji nisu u git-u, a bez kojih build ne radi
nedostaje=()
for f in server/.env server/src/main/resources/application.properties client/.env admin/.env webapp/.env; do
  [[ -f "$KOREN/$f" ]] || nedostaje+=("$f")
done
if ! ls "$KOREN"/server/src/main/resources/*.pem >/dev/null 2>&1; then
  nedostaje+=("server/src/main/resources/*.pem (ključevi za plaćanje)")
fi
if [[ ${#nedostaje[@]} -gt 0 ]]; then
  echo "Nedostaju fajlovi (nisu u git-u, kopiraj ih ručno):" >&2
  printf '  %s\n' "${nedostaje[@]}" >&2
  exit 1
fi

echo "==> git pull (dev)"
git -C "$KOREN" pull --ff-only origin dev
git -C "$KOREN" log --oneline -1

for deo in "${DELOVI[@]}"; do
  case "$deo" in
    server)
      echo "==> Backend"
      (cd "$KOREN/server" && chmod +x mvnw && ./mvnw -q -DskipTests package)
      ;;
    client | admin | webapp)
      echo "==> $deo"
      (cd "$KOREN/$deo" && npm ci --no-audit --no-fund && npm run build)
      ;;
    *)
      echo "Nepoznat deo: $deo (server, client, admin, webapp)" >&2
      exit 1
      ;;
  esac
done

echo "==> pm2"
pm2 startOrReload "$KOREN/deploy/dev/ecosystem.config.cjs" --update-env
pm2 save
pm2 status
