#!/usr/bin/env bash
# Jednokratno postavljanje dev servera (Ubuntu 24.04), pokreće se kao root:
#   curl -fsSL https://raw.githubusercontent.com/ss20220388/studio27/dev/deploy/dev/postavi.sh -o postavi.sh
#   bash postavi.sh
# Instalira nginx, MySQL, Javu 25, Node 22 i pm2, preuzima dev granu u /srv/studio27
# i postavlja nginx za dev.27archviz.com. Na kraju ispisuje šta još treba uraditi ručno.
set -euo pipefail

KOREN="${STUDIO27_KOREN:-/srv/studio27}"
REPO="${STUDIO27_REPO:-https://github.com/ss20220388/studio27.git}"
DOMENI=(dev.27archviz.com api.dev.27archviz.com admin.dev.27archviz.com app.dev.27archviz.com)

if [[ $EUID -ne 0 ]]; then
  echo "Pokreni kao root (sudo bash postavi.sh)." >&2
  exit 1
fi

echo "==> Paketi"
apt-get update
apt-get install -y ca-certificates curl gnupg git rsync nginx mysql-server certbot python3-certbot-nginx

echo "==> Java 25 (Liberica, ista kao lokalno)"
if ! command -v java >/dev/null || ! java -version 2>&1 | grep -q '"25'; then
  curl -fsSL https://download.bell-sw.com/pki/GPG-KEY-bellsoft | gpg --dearmor --yes -o /usr/share/keyrings/bellsoft.gpg
  echo "deb [signed-by=/usr/share/keyrings/bellsoft.gpg] https://apt.bell-sw.com/ stable main" > /etc/apt/sources.list.d/bellsoft.list
  apt-get update
  apt-get install -y bellsoft-java25
fi

echo "==> Node 22 i pm2"
if ! command -v node >/dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 22 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
command -v pm2 >/dev/null || npm install -g pm2

echo "==> Kod (grana dev) u $KOREN"
if [[ -d "$KOREN/.git" ]]; then
  git -C "$KOREN" fetch origin dev
  git -C "$KOREN" checkout dev
  git -C "$KOREN" pull --ff-only origin dev
else
  # privatan repo: git će tražiti GitHub korisnika i token (Settings > Developer settings > Personal access tokens)
  git clone -b dev "$REPO" "$KOREN"
fi

echo "==> Folder za slike"
mkdir -p /assets/uploads

echo "==> nginx"
cp "$KOREN/deploy/dev/studio27-proxy.conf" /etc/nginx/snippets/studio27-proxy.conf
cp "$KOREN/deploy/dev/dev.27archviz.com.conf" /etc/nginx/sites-available/dev.27archviz.com.conf
ln -sf /etc/nginx/sites-available/dev.27archviz.com.conf /etc/nginx/sites-enabled/dev.27archviz.com.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> pm2 se pokreće posle restarta servera"
pm2 startup systemd -u root --hp /root >/dev/null

cat <<EOF

Gotovo sa instalacijom. Ostalo je ručno (redom):

 1. Namecheap > Advanced DNS: A zapisi "dev" i "*.dev" -> IP ovog servera.

 2. https (kada DNS proradi, proveri sa: ping dev.27archviz.com):
      certbot --nginx $(printf -- '-d %s ' "${DOMENI[@]}")

 3. MySQL: napravi bazu i korisnika ISTA kao u application.properties (spring.datasource.*):
      mysql -e "CREATE DATABASE studio27baza CHARACTER SET utf8mb4;"
      mysql -e "CREATE USER 'KORISNIK'@'localhost' IDENTIFIED BY 'LOZINKA'; GRANT ALL ON studio27baza.* TO 'KORISNIK'@'localhost';"

 4. Baza i slike sa produkcije:
      bash $KOREN/deploy/dev/kopiraj-sa-produkcije.sh root@IP_PRODUKCIJE

 5. Fajlovi koji nisu u git-u (kopiraj sa svog računara, npr. scp):
      $KOREN/server/src/main/resources/application.properties   (plaćanje u TEST režimu!)
      $KOREN/server/src/main/resources/*.pem *.crt ...            (ključevi)
      $KOREN/server/.env
      $KOREN/client/.env  $KOREN/admin/.env  $KOREN/webapp/.env
    Primeri: client/.env.example i server/.env.example (adrese https://*.dev.27archviz.com)

 6. Build i pokretanje (i svako sledeće ažuriranje):
      bash $KOREN/deploy/dev/azuriraj.sh
EOF
