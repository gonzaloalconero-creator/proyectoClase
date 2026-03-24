#!/usr/bin/env bash
set -euo pipefail

# One-command deploy for Debian servers:
# 1) update repository with git pull
# 2) rebuild and restart Docker services

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git no esta instalado." >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker no esta instalado." >&2
  exit 1
fi

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "Error: no se encontro docker compose ni docker-compose." >&2
    exit 1
  fi
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: este directorio no es un repositorio git." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: hay cambios locales sin guardar. Haz commit/stash antes de desplegar." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"

echo "[1/4] Actualizando repositorio..."
git fetch --all --prune
git pull --ff-only origin "$BRANCH"

echo "[2/4] Construyendo imagenes..."
compose build --pull

echo "[3/4] Levantando servicios..."
compose up -d --remove-orphans

echo "[4/4] Estado final:"
compose ps

echo "Despliegue completado correctamente."
