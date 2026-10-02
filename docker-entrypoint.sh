#!/bin/sh
set -eu
cd /var/www/html
if [ -n "${DB_SSL_CA_PEM:-}" ]; then
  printf '%s\n' "$DB_SSL_CA_PEM" > /tmp/aiven-ca.pem
  export DB_SSL_CA=/tmp/aiven-ca.pem
fi
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php lava migration run
fi
port="${PORT:-10000}"
sed -i "s/Listen 80/Listen $port/" /etc/apache2/ports.conf
sed -i "s/:80>/:$port>/" /etc/apache2/sites-available/000-default.conf
exec apache2-foreground
