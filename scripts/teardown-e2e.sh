#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🐳 Stopping test database..."
docker compose -f "$PROJECT_DIR/docker-compose.test.yml" down -v

echo "✅ E2E teardown complete!"
