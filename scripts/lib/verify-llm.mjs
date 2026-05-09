/**
 * verify-llm.mjs — LLM-based per-event verification.
 *
 * Given an extracted event {showSlug, date, hour, venueName} and the source
 * page it was scraped from, ask the model whether the page actually says
 * this show is on at that date/time. Returns a structured verdict that
 * other code can fold into the anomaly stream.
 *
 * Uses the same GitHub Models channel as ai.mjs (free, gpt-4o-mini).
 */

const VERIFY_MODEL = "gpt-4o-mini";

// Strip a fetched HTML doc down to roughly the visible text so the model
// gets a budget-friendly prompt. Removes scripts/styles, then collapses
// whitespace. Truncates to MAX_CHARS to bound token cost.
const MAX_CHARS = 8000;
export function htmlToText(html) {
  if (!html) return "";
  let text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
  return text;
}

export async function fetchPageText(url, { timeoutMs = 15_000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Mimic a normal browser — some sites return different markup or
        // block plain Node user-agents.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "he,en;q=0.9",
      },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, text: "" };
    }
    const html = await res.text();
    return { ok: true, status: res.status, text: htmlToText(html) };
  } catch (err) {
    return { ok: false, status: 0, text: "", error: err.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Ask the model whether the page corroborates the claimed event.
 *
 * Returns:
 *   { verdict: "agree" | "disagree" | "uncertain", reason: string }
 *
 * "agree" — page lists this show on this date at this hour
 * "disagree" — page lists this show but with different date/hour, OR
 *              page no longer lists this show, OR show is cancelled
 * "uncertain" — page text doesn't mention dates clearly enough to decide
 */
export async function verifyEvent(aiClient, { event, pageText }) {
  if (!pageText) {
    return { verdict: "uncertain", reason: "page fetch failed or empty" };
  }

  const claim = [
    `הצגה: ${event.showSlug ?? `show-${event.showId}`}`,
    `תאריך: ${event.date}`,
    `שעה: ${event.hour}`,
    event.venueName ? `אולם: ${event.venueName}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await aiClient.chat.completions.create({
    model: VERIFY_MODEL,
    temperature: 0,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "אתה מאמת נתוני הצגות תיאטרון. קיבלת טקסט שנשלף מדף אינטרנט עברי",
          "ופרטי אירוע שנגרדו ממנו (תאריך, שעה, שם הצגה).",
          "השווה את האירוע לטקסט הדף וקבע אם הדף מאשר את האירוע.",
          "",
          'החזר JSON: { "verdict": "agree"|"disagree"|"uncertain", "reason": "הסבר קצר בעברית" }',
          "",
          'agree — הדף מציין באופן חד-משמעי שההצגה הזו מתקיימת בתאריך ובשעה האלו.',
          'disagree — הדף מציין שההצגה מתקיימת בתאריך/שעה אחרים, או שההצגה בוטלה/נדחתה, או שאינה מופיעה כלל בדף.',
          'uncertain — הטקסט לא ברור מספיק כדי להחליט (אין תאריכים מפורשים, אזהרת cloudflare, וכד׳).',
          "",
          "אל תוסיף הערות מחוץ ל-JSON.",
        ].join("\n"),
      },
      {
        role: "user",
        content: `פרטי האירוע שיש לאמת:\n${claim}\n\nטקסט הדף:\n${pageText}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw);
    const verdict =
      parsed.verdict === "agree" ||
      parsed.verdict === "disagree" ||
      parsed.verdict === "uncertain"
        ? parsed.verdict
        : "uncertain";
    return {
      verdict,
      reason: typeof parsed.reason === "string" ? parsed.reason : "",
    };
  } catch {
    return { verdict: "uncertain", reason: "model returned malformed JSON" };
  }
}

/**
 * Verify multiple events that share a single source page in one LLM call.
 *
 * Drops the per-event call cost dramatically: a show with 10 performance
 * dates lives on one detail page, so one fetch + one model call covers
 * all 10 events instead of 10 round trips.
 *
 * Returns an array of verdicts in the same order as `events`.
 *   [{ verdict: "agree"|"disagree"|"uncertain", reason: string }, ...]
 *
 * If the model returns malformed output or fewer entries than expected,
 * missing slots are filled with { verdict: "uncertain", reason: "..." }
 * so the caller never sees a length mismatch.
 */
export async function verifyEventsBatch(aiClient, { events, pageText }) {
  if (events.length === 0) return [];
  if (!pageText) {
    return events.map(() => ({
      verdict: "uncertain",
      reason: "page fetch failed or empty",
    }));
  }

  const numbered = events
    .map((e, i) => {
      const parts = [
        `${i + 1}. תאריך: ${e.date}`,
        `שעה: ${e.hour}`,
        `הצגה: ${e.showSlug ?? `show-${e.showId}`}`,
      ];
      if (e.venueName) parts.push(`אולם: ${e.venueName}`);
      return parts.join(" | ");
    })
    .join("\n");

  const response = await aiClient.chat.completions.create({
    model: VERIFY_MODEL,
    temperature: 0,
    max_tokens: Math.min(2000, 80 * events.length + 200),
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "אתה מאמת נתוני הצגות תיאטרון. קיבלת טקסט שנשלף מדף אינטרנט עברי",
          "ורשימה ממוספרת של אירועים שנגרדו ממנו.",
          "עבור כל אירוע, השווה אותו לטקסט הדף וקבע אם הדף מאשר אותו.",
          "",
          "אותו דף משותף לכל האירועים — בדרך כלל זה דף הצגה אחת עם מספר תאריכים.",
          "אם הדף לא מציג את אותה הצגה כלל, סמן את כולם כ-disagree.",
          "",
          'החזר JSON: { "verdicts": [{ "index": 1, "verdict": "agree"|"disagree"|"uncertain", "reason": "הסבר קצר" }, ...] }',
          "החזר תוצאה לכל אירוע ברשימה, באותו סדר.",
          "",
          'agree — הדף מציין באופן חד-משמעי שההצגה מתקיימת בתאריך ובשעה האלה.',
          'disagree — הדף מציין תאריך/שעה אחרים, או שההצגה בוטלה/נדחתה, או שהיא לא מופיעה כלל.',
          'uncertain — הטקסט לא ברור מספיק כדי להחליט.',
        ].join("\n"),
      },
      {
        role: "user",
        content: `${events.length} אירועים לאימות:\n${numbered}\n\nטקסט הדף:\n${pageText}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "";
  const out = events.map(() => ({
    verdict: "uncertain",
    reason: "no verdict returned",
  }));

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.verdicts)) return out;
    for (const v of parsed.verdicts) {
      const i = (Number(v.index) || 0) - 1;
      if (i < 0 || i >= events.length) continue;
      const verdict =
        v.verdict === "agree" ||
        v.verdict === "disagree" ||
        v.verdict === "uncertain"
          ? v.verdict
          : "uncertain";
      out[i] = {
        verdict,
        reason: typeof v.reason === "string" ? v.reason : "",
      };
    }
  } catch {
    return events.map(() => ({
      verdict: "uncertain",
      reason: "model returned malformed JSON",
    }));
  }

  return out;
}
