#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🔧 Loading test environment..."
set -a
source "$PROJECT_DIR/.env.test"
set +a

echo "🐳 Starting test database..."
docker compose -f "$PROJECT_DIR/docker-compose.test.yml" up -d --wait

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed

echo "👤 Creating test user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('TestPassword123!', 10);
  await prisma.user.upsert({
    where: { email: 'test@e2e.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@e2e.com',
      password: hash,
    },
  });
  console.log('Test user created: test@e2e.com / TestPassword123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
"

echo "✅ E2E setup complete!"
