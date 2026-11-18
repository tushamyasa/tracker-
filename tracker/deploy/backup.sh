#!/usr/bin/env bash
# Резервная копия базы PostgreSQL и загруженных фото. Запускайте из cron, например раз в сутки:
#   0 3 * * * /opt/tracker/deploy/backup.sh >> /var/log/tracker-backup.log 2>&1
# Нужны: pg_dump и переменная DATABASE_URL (например, из /etc/tracker.env).
set -euo pipefail

: "${DATABASE_URL:?Задайте DATABASE_URL}"
UPLOAD_DIR="${UPLOAD_DIR:-/var/lib/tracker/uploads}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tracker}"
KEEP="${KEEP:-14}"                             # сколько копий хранить

stamp="$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# Параметры вроде ?pgbouncer=true pg_dump не понимает, поэтому убираем строку запроса.
pg_dump "${DATABASE_URL%%\?*}" -Fc -f "$work/db.dump"
if [ -d "$UPLOAD_DIR" ]; then
  cp -r "$UPLOAD_DIR" "$work/uploads"
fi

tar -czf "$BACKUP_DIR/tracker-$stamp.tar.gz" -C "$work" .
echo "backup written: $BACKUP_DIR/tracker-$stamp.tar.gz"

# Удаляем старые копии, оставляя последние $KEEP.
ls -1t "$BACKUP_DIR"/tracker-*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
