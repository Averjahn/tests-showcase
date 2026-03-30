#!/bin/bash
# Деплой trainers-showcase на VPS одной командой.
# Запуск: ./scripts/deploy-vps-now.sh
#
# Логика как у next-project/deploy-vps-now.sh:
# 1) удалить старую серверную папку проекта
# 2) загрузить свежий архив
# 3) поднять контейнер через docker compose

set -e

VPS="root@170.168.16.142"
REMOTE_DIR="/opt/trainers-showcase"
ARCHIVE_NAME="trainers-showcase-deploy.tar.gz"
TMP_DIR="$(mktemp -d)"
ARCHIVE_PATH="$TMP_DIR/$ARCHIVE_NAME"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -n "$SSHPASS" ] && command -v sshpass >/dev/null 2>&1; then
  SCP() { sshpass -p "$SSHPASS" scp "$@"; }
  SSH() { sshpass -p "$SSHPASS" ssh "$@"; }
else
  if [ ! -t 0 ] && [ -z "$SSHPASS" ]; then
    echo "Ошибка: запускай скрипт из терминала (Terminal.app), не из Code Runner."
    echo "Выполни:"
    echo "  cd $PROJECT_ROOT"
    echo "  SSHPASS='твой_пароль_vps' ./scripts/deploy-vps-now.sh"
    exit 1
  fi
  SCP() { scp "$@"; }
  SSH() { ssh "$@"; }
fi

cd "$PROJECT_ROOT"

if [ ! -f .env ]; then
  echo "Создаю .env из env.vps.example..."
  cp env.vps.example .env
  echo "Отредактируй .env при необходимости и запусти скрипт снова."
  exit 0
fi

echo "Собираю архив проекта..."
tar --exclude=".git" --exclude="node_modules" --exclude=".next" -czf "$ARCHIVE_PATH" .

echo "На VPS: удаляю старую папку проекта..."
SSH -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$VPS" "rm -rf $REMOTE_DIR && mkdir -p $REMOTE_DIR"

# Загрузка в /tmp, затем перенос: на части VPS запись в /opt падает (диск/inodes), а /tmp на другом томе.
REMOTE_TMP_ARCHIVE="/tmp/$ARCHIVE_NAME.$$"

echo "Проверка места на VPS..."
SSH -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$VPS" "df -h $REMOTE_DIR /tmp 2>/dev/null; echo '--- inodes ---'; df -i $REMOTE_DIR /tmp 2>/dev/null || df -i /"

echo "Загружаю архив и .env на VPS..."
if ! SCP -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$ARCHIVE_PATH" "$VPS:$REMOTE_TMP_ARCHIVE"; then
  echo ""
  echo "Ошибка загрузки архива. На сервере проверь: df -h && df -i"
  echo "Освободи место, например: docker system prune -af --volumes  (осторожно: удалит неиспользуемые образы и тома)"
  exit 1
fi
SCP -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 .env "$VPS:$REMOTE_DIR/.env"

echo "Переношу архив в $REMOTE_DIR..."
SSH -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$VPS" "mv -f $REMOTE_TMP_ARCHIVE $REMOTE_DIR/$ARCHIVE_NAME"

echo "Распаковываю и запускаю контейнер..."
REMOTE_CMD='
  cd '"$REMOTE_DIR"' &&
  tar -xzf '"$ARCHIVE_NAME"' &&
  rm -f '"$ARCHIVE_NAME"' &&
  docker compose -f docker-compose.vps.yml --env-file .env down --remove-orphans 2>/dev/null || true &&
  docker compose -f docker-compose.vps.yml --env-file .env up -d --build &&
  docker compose -f docker-compose.vps.yml ps
'
SSH -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ServerAliveInterval=30 -o ServerAliveCountMax=20 "$VPS" "$REMOTE_CMD"

echo ""
echo "Готово. Открой: http://170.168.16.142:3010"
