#!/usr/bin/env node
/**
 * Assign anonymous reviews to a registered user account.
 *
 * Only updates the `userId` field — all other fields (author, anonToken, ip,
 * rating, text, etc.) are preserved as-is. Skips any show where the user
 * already has an authenticated review (unique constraint: userId + showId).
 *
 * Usage:
 *   node scripts/assign-reviews-to-user.mjs --email user@example.com --author "יודית"
 *   node scripts/assign-reviews-to-user.mjs --email user@example.com --author "יודית" --apply
 *   node scripts/assign-reviews-to-user.mjs --email user@example.com --ids 101,102,103
 *   node scripts/assign-reviews-to-user.mjs --email user@example.com --ids 101,102,103 --apply
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./lib/db.mjs";
import {
  bold,
  green,
  red,
  yellow,
  cyan,
  dim,
  bidi,
  separator,
  thinSeparator,
  printField,
} from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(rootDir, ".env.local") });
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(rootDir, ".env") });
  }
}

const apply = process.argv.includes("--apply");

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const emailArg = getArg("--email");
const authorArg = getArg("--author");
const idsArg = getArg("--ids");

if (!emailArg || (!authorArg && !idsArg)) {
  console.error("Usage: node scripts/assign-reviews-to-user.mjs --email <email> --author <name> [--apply]");
  console.error("       node scripts/assign-reviews-to-user.mjs --email <email> --ids <id,id,...> [--apply]");
  process.exit(1);
}

const reviewIds = idsArg ? idsArg.split(",").map((s) => parseInt(s.trim(), 10)) : null;

async function main() {
  console.log(`\nMode: ${apply ? red(bold("APPLY")) : cyan(bold("DRY-RUN"))}\n`);

  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL is not set."));
    process.exit(1);
  }

  const { prisma, pool } = db;

  try {
    // ── 1. Find target user ────────────────────────────────────────
    separator();
    console.log(bold("Target user"));
    separator();

    const targetUser = await prisma.user.findFirst({
      where: { email: emailArg },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      console.error(red(`No user with email '${emailArg}' found. Aborting.`));
      process.exit(1);
    }

    printField("ID:", targetUser.id);
    printField("Name:", targetUser.name);
    printField("Email:", targetUser.email);

    // ── 2. Find user's existing authenticated reviews ──────────────
    const existingReviews = await prisma.review.findMany({
      where: { userId: targetUser.id },
      select: {
        showId: true,
        show: { select: { title: true } },
      },
    });

    const existingShowIds = new Set(existingReviews.map((r) => r.showId));
    printField("Existing reviews:", existingReviews.length);

    if (existingReviews.length > 0) {
      for (const r of existingReviews) {
        console.log(`    ${dim("-")} ${bidi(r.show.title)}`);
      }
    }

    // ── 3. Find anonymous reviews by author or IDs ──────────────────
    console.log();
    separator();
    const filterLabel = reviewIds
      ? `Anonymous reviews by IDs: ${reviewIds.join(", ")}`
      : `Anonymous reviews by "${authorArg}"`;
    console.log(bold(filterLabel));
    separator();

    const anonReviews = await prisma.review.findMany({
      where: reviewIds
        ? { id: { in: reviewIds }, userId: null }
        : { userId: null, author: authorArg },
      include: {
        show: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { date: "asc" },
    });

    console.log(`Found: ${bold(anonReviews.length)}\n`);

    if (anonReviews.length === 0) {
      console.log(green("Nothing to do — no anonymous reviews found."));
      return;
    }

    // ── 4. Partition: assign vs. skip ──────────────────────────────
    const toAssign = [];
    const toSkip = [];

    for (const review of anonReviews) {
      if (existingShowIds.has(review.showId)) {
        toSkip.push(review);
      } else {
        toAssign.push(review);
      }
    }

    // ── 5. Print skipped reviews ───────────────────────────────────
    if (toSkip.length > 0) {
      console.log(yellow(bold(`SKIP (${toSkip.length}) — user already reviewed this show:`)));
      thinSeparator();
      for (const r of toSkip) {
        console.log(
          `  ${dim(`#${r.id}`)}  ${dim("★")}${r.rating}  ${dim(r.date.toISOString().slice(0, 10))}  ${bidi(r.show.title)}`,
        );
      }
      console.log();
    }

    // ── 6. Print reviews to assign ─────────────────────────────────
    console.log(green(bold(`ASSIGN (${toAssign.length}):`)));
    thinSeparator();
    for (const r of toAssign) {
      console.log(
        `  ${dim(`#${r.id}`)}  ${dim("★")}${r.rating}  ${dim(r.date.toISOString().slice(0, 10))}  ${bidi(r.show.title)}`,
      );
    }

    // ── 7. Summary ─────────────────────────────────────────────────
    console.log();
    separator();
    console.log(
      `Summary: ${green(bold(toAssign.length))} to assign, ${yellow(bold(toSkip.length))} to skip`,
    );
    separator();

    // ── 8. Dry-run exit ────────────────────────────────────────────
    if (!apply) {
      console.log(cyan("\nRun with --apply to execute.\n"));
      return;
    }

    // ── 9. Apply ───────────────────────────────────────────────────
    console.log();
    let successCount = 0;
    let failCount = 0;

    for (const review of toAssign) {
      try {
        await prisma.review.update({
          where: { id: review.id },
          data: { userId: targetUser.id },
        });
        successCount++;
        console.log(green(`  OK   #${review.id}  ${bidi(review.show.title)}`));
      } catch (err) {
        failCount++;
        console.log(red(`  FAIL #${review.id}  ${bidi(review.show.title)}: ${err.message}`));
      }
    }

    // ── 10. Verify ─────────────────────────────────────────────────
    console.log();
    separator();
    const totalReviews = await prisma.review.count({
      where: { userId: targetUser.id },
    });
    console.log(bold("Verification"));
    printField("Reviews before:", existingReviews.length);
    printField("Assigned:", successCount);
    printField("Failed:", failCount);
    printField("Total now:", totalReviews);
    separator();
    console.log();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(red("Fatal error:"), err);
  process.exit(1);
});
