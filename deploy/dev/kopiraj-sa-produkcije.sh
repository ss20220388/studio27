#!/usr/bin/env bash
# Kopira bazu i sve slike sa produkcije na dev server (pokreće se NA dev serveru):
#   bash kopiraj-sa-produkcije.sh root@IP_PRODUKCIJE            # baza + slike
#   bash kopiraj-sa-produkcije.sh root@IP_PRODUKCIJE slike      # samo slike
#   bash kopiraj-sa-produkcije.sh root@IP_PRODUKCIJE baza       # samo baza
# Sa produkcije se samo čita; baza na dev-u se zamenjuje kopijom.
# Ako MySQL na produkciji traži lozinku: PROD_DB_LOZINKA='...' bash kopiraj-sa-produkcije.sh ...
set -euo pipefail

PROD="${1:?Navedi produkcijski server, npr. root@1.2.3.4}"
STA="${2:-sve}"
BAZA="${STUDIO27_BAZA:-studio27baza}"
# folder sa slikama na produkciji (nginx: location /api/uploaded-images/ -> alias)
PROD_SLIKE="${PROD_SLIKE:-/assets/}"

if [[ "$STA" == "sve" || "$STA" == "slike" ]]; then
  echo "==> Slike: $PROD:$PROD_SLIKE -> /assets/"
  mkdir -p /assets
  rsync -az --info=progress2 "$PROD:$PROD_SLIKE" /assets/
fi

if [[ "$STA" == "sve" || "$STA" == "baza" ]]; then
  echo "==> Baza $BAZA"
  dump="/root/${BAZA}-$(date +%Y%m%d-%H%M).sql"
  ssh "$PROD" "MYSQL_PWD='${PROD_DB_LOZINKA:-}' mysqldump -u root --single-transaction --routines --no-tablespaces $BAZA" > "$dump"
  echo "    dump: $dump ($(du -h "$dump" | cut -f1))"
  mysql -e "CREATE DATABASE IF NOT EXISTS \`$BAZA\` CHARACTER SET utf8mb4;"
  mysql "$BAZA" < "$dump"
  echo "    uvezeno u $BAZA"
fi

echo "Gotovo. Restart backenda: pm2 restart api-dev"
