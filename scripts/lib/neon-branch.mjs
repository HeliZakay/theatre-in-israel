#!/usr/bin/env node
/**
 * Creates a dated Neon branch snapshot of the production (default) branch,
 * then prunes old backup-* branches so we never exceed KEEP retained
 * snapshots (keeps headroom within the Free plan's 10-branch cap).
 *
 * Idempotent: if a branch named backup-<today> already exists, creation
 * is skipped and pruning still runs.
 *
 * Env: NEON_API_KEY, NEON_PROJECT_ID
 */

const API_KEY = process.env.NEON_API_KEY;
const PROJECT_ID = process.env.NEON_PROJECT_ID;
const KEEP = 4;

if (!API_KEY) {
  console.error("NEON_API_KEY not set");
  process.exit(1);
}
if (!PROJECT_ID) {
  console.error("NEON_PROJECT_ID not set");
  process.exit(1);
}

const BASE = `https://console.neon.tech/api/v2/projects/${PROJECT_ID}`;

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon API ${method} ${path} -> ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function listBackupBranches() {
  const { branches } = await api("GET", "/branches");
  return branches;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const branchName = `backup-${today}`;

  let branches = await listBackupBranches();
  const parent = branches.find((b) => b.default);
  if (!parent) throw new Error("Could not find default branch");

  const existing = branches.find((b) => b.name === branchName);
  if (existing) {
    console.log(`Branch ${branchName} already exists (id=${existing.id}); skipping create.`);
  } else {
    console.log(`Creating branch ${branchName} from ${parent.name}...`);
    const res = await api("POST", "/branches", {
      branch: { name: branchName, parent_id: parent.id },
    });
    console.log(`Created branch ${res.branch.name} (id=${res.branch.id})`);
    branches = await listBackupBranches();
  }

  const backupBranches = branches
    .filter((b) => /^backup-\d{4}-\d{2}-\d{2}$/.test(b.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  const toDelete = backupBranches.slice(KEEP);
  for (const b of toDelete) {
    console.log(`Pruning old backup branch: ${b.name} (id=${b.id})`);
    await api("DELETE", `/branches/${b.id}`);
  }

  console.log(`Retained ${Math.min(backupBranches.length, KEEP)} backup branch(es); pruned ${toDelete.length}.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
