#!/bin/sh
set -e

DATA_DIR=/app/data
DB_FILE="$DATA_DIR/dev.db"
APP_DB=/app/dev.db

mkdir -p "$DATA_DIR"

if [ ! -f "$DB_FILE" ] && [ -f "$APP_DB" ] && [ ! -L "$APP_DB" ]; then
  echo "[entrypoint] seeding $DB_FILE from image layer"
  cp "$APP_DB" "$DB_FILE"
fi

if [ ! -L "$APP_DB" ]; then
  rm -f "$APP_DB"
  ln -s "$DB_FILE" "$APP_DB"
fi

echo "[entrypoint] db resolved: $(readlink -f "$APP_DB")"
exec npm start
