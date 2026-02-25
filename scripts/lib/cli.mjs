/**
 * CLI display helpers — ANSI colours, bidi text handling, formatted output.
 *
 * Provides consistent terminal formatting for all scripts.
 */

// ── Unicode bidi isolates ──────────────────────────────────────
// Wrapping Hebrew text in these tells the terminal to render the
// enclosed text as RTL without affecting the rest of the line.

const RLI = "\u2067"; // Right-to-Left Isolate
const PDI = "\u2069"; // Pop Directional Isolate

/**
 * Wrap a string in RTL isolate if it contains Hebrew characters.
 * @param {string} s
 * @returns {string}
 */
export function bidi(s) {
  if (!s) return s;
  const str = String(s);
  if (/[\u0590-\u05FF]/.test(str)) {
    return `${RLI}${str}${PDI}`;
  }
  return str;
}

// ── ANSI colour helpers ────────────────────────────────────────

export const bold = (s) => `\x1b[1m${s}\x1b[22m`;
export const dim = (s) => `\x1b[2m${s}\x1b[22m`;
export const cyan = (s) => `\x1b[36m${s}\x1b[39m`;
export const yellow = (s) => `\x1b[33m${s}\x1b[39m`;
export const green = (s) => `\x1b[32m${s}\x1b[39m`;
export const red = (s) => `\x1b[31m${s}\x1b[39m`;
export const magenta = (s) => `\x1b[35m${s}\x1b[39m`;
export const bgCyan = (s) => `\x1b[46m\x1b[30m ${s} \x1b[0m`;

// ── Formatted field printing ───────────────────────────────────

const SEP_W = 60;

/** Print a separator line. */
export function separator() {
  console.log(dim("=".repeat(SEP_W)));
}

/** Print a thin separator line. */
export function thinSeparator() {
  console.log(dim("-".repeat(SEP_W)));
}

/** Print a labelled single-line field. */
export function printField(label, value) {
  if (!value && value !== 0) return;
  console.log(`  ${yellow(label)}  ${bidi(value)}`);
}

/** Print a labelled multi-line field. */
export function printMultiLine(label, text) {
  if (!text) return;
  console.log(`  ${yellow(label)}`);
  for (const line of String(text).split("\n")) {
    if (line.trim()) console.log(`    ${bidi(line.trim())}`);
  }
}
