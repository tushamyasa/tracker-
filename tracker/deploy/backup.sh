#!/usr/bin/env bash
# Резервная копия базы и загруженных фото. Запускайте из cron, например раз в сутки:
#   0 3 * * * /opt/tracker/deploy/backup.sh >> /var/log/tracker-backup.log 2>&1
set -euo pipefail

DATA_DIR="${DATA_DIR:-/var/lib/tracker}"      # где лежат app.db и uploads/
BACKUP_DIR="${BACKUP_DIR:-/var/backups/tracker}"
KEEP="${KEEP:-14}"                             # сколько копий хранить

stamp="$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# .backup даёт согласованную копию даже при работающем приложении (в отличие от cp).
sqlite3 "$DATA_DIR/app.db" ".backup '$work/app.db'"
if [ -d "$DATA_DIR/uploads" ]; then
  cp -r "$DATA_DIR/uploads" "$work/uploads"
fi

tar -czf "$BACKUP_DIR/tracker-$stamp.tar.gz" -C "$work" .
echo "backup written: $BACKUP_DIR/tracker-$stamp.tar.gz"

# Удаляем старые копии, оставляя последние $KEEP.
ls -1t "$BACKUP_DIR"/tracker-*.tar.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
