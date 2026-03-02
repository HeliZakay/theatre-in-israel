#!/usr/bin/env node
/**
 * lottery-draw.mjs
 *
 * Standalone admin script to pick a weighted-random lottery winner.
 * Each authenticated review since the campaign start date = 1 entry.
 *
 * Usage:
 *   node scripts/lottery-draw.mjs               # pick a winner
 *   node scripts/lottery-draw.mjs --dry-run      # show leaderboard only
 */

import "dotenv/config";
import { createPrismaClient } from "./lib/db.mjs";

/* ── Lottery config (mirrors src/constants/lottery.ts) ────────── */
const LOTTERY_START_DATE = new Date("2026-03-03");

/* ── CLI flags ────────────────────────────────────────────────── */
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const db = await createPrismaClient();
  if (!db) {
    console.error("❌  DATABASE_URL is not set. Cannot connect to database.");
    process.exit(1);
  }

  const { prisma, pool } = db;

  try {
    /* ── Build leaderboard ──────────────────────────────────── */
    const rows = await prisma.review.groupBy({
      by: ["userId"],
      where: {
        userId: { not: null },
        createdAt: { gte: LOTTERY_START_DATE },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    if (rows.length === 0) {
      console.log(
        "📭  No lottery entries found since",
        LOTTERY_START_DATE.toISOString(),
      );
      return;
    }

    const userIds = rows.map((r) => r.userId).filter(Boolean);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = rows
      .filter((r) => r.userId !== null)
      .map((r) => {
        const user = userMap.get(r.userId);
        return {
          userId: r.userId,
          name: user?.name ?? "(ללא שם)",
          email: user?.email ?? "(ללא אימייל)",
          entries: r._count.id,
        };
      });

    const totalEntries = leaderboard.reduce((sum, p) => sum + p.entries, 0);
    const totalParticipants = leaderboard.length;

    /* ── Print leaderboard ──────────────────────────────────── */
    console.log("\n🎟️  הגרלה — טבלת משתתפים");
    console.log("═".repeat(60));
    console.log("#".padEnd(4), "שם".padEnd(24), "כרטיסים".padEnd(10), "אימייל");
    console.log("─".repeat(60));

    leaderboard.forEach((p, i) => {
      console.log(
        String(i + 1).padEnd(4),
        p.name.padEnd(24),
        String(p.entries).padEnd(10),
        p.email,
      );
    });

    console.log("─".repeat(60));
    console.log(`סה"כ: ${totalParticipants} משתתפים, ${totalEntries} כרטיסים`);
    console.log();

    /* ── Dry-run: stop here ─────────────────────────────────── */
    if (dryRun) {
      console.log("🏁  --dry-run: לא מגרילים. סיום.");
      return;
    }

    /* ── Weighted random draw ───────────────────────────────── */
    const weightedList = [];
    for (const participant of leaderboard) {
      for (let i = 0; i < participant.entries; i++) {
        weightedList.push(participant);
      }
    }

    const winnerIndex = Math.floor(Math.random() * weightedList.length);
    const winner = weightedList[winnerIndex];

    console.log("🎉  הזוכה בהגרלה:");
    console.log("═".repeat(60));
    console.log(`   שם:       ${winner.name}`);
    console.log(`   אימייל:   ${winner.email}`);
    console.log(`   כרטיסים:  ${winner.entries} (מתוך ${totalEntries})`);
    console.log(
      `   סיכוי:    ${((winner.entries / totalEntries) * 100).toFixed(1)}%`,
    );
    console.log("═".repeat(60));
    console.log();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌  Error:", err);
  process.exit(1);
});
