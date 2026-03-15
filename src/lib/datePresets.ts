const TZ = 'Asia/Jerusalem';

/**
 * Get the local date parts in Asia/Jerusalem for a given instant.
 */
function getJerusalemParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)!.value;

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday'), // Sun, Mon, Tue, Wed, Thu, Fri, Sat
  };
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Build a UTC midnight Date for a given Jerusalem calendar date.
 * Since Event.date is @db.Date (stored as midnight UTC), we use UTC dates
 * for Prisma gte/lte comparisons.
 */
function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(year: number, month: number, day: number, offset: number) {
  const d = utcDate(year, month, day);
  d.setUTCDate(d.getUTCDate() + offset);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function resolveDatePreset(
  preset: string,
  now?: Date,
): { from: Date; to: Date } {
  const ref = now ?? new Date();
  const { year, month, day, weekday } = getJerusalemParts(ref);
  const dow = WEEKDAY_INDEX[weekday];

  switch (preset) {
    case 'today':
      return { from: utcDate(year, month, day), to: utcDate(year, month, day) };

    case 'tomorrow': {
      const tm = addDays(year, month, day, 1);
      return { from: utcDate(tm.year, tm.month, tm.day), to: utcDate(tm.year, tm.month, tm.day) };
    }

    case '7days': {
      const end = addDays(year, month, day, 6);
      return { from: utcDate(year, month, day), to: utcDate(end.year, end.month, end.day) };
    }

    case 'weekend': {
      // Israeli weekend: Thu–Sat
      // Thu/Fri/Sat (dow 4–6): we're in the current weekend → go back to this Thu
      // Sun–Wed (dow 0–3): weekend has passed → auto-forward to next Thu
      const daysToThu = dow >= 4 ? -(dow - 4) : 4 - dow;
      const thu = addDays(year, month, day, daysToThu);
      const sat = addDays(thu.year, thu.month, thu.day, 2);
      return { from: utcDate(thu.year, thu.month, thu.day), to: utcDate(sat.year, sat.month, sat.day) };
    }

    case 'week': {
      // Current week: Mon–Sat
      const daysToMon = dow === 0 ? -6 : 1 - dow; // Sunday → go back 6 days
      const mon = addDays(year, month, day, daysToMon);
      const sat = addDays(mon.year, mon.month, mon.day, 5);
      return { from: utcDate(mon.year, mon.month, mon.day), to: utcDate(sat.year, sat.month, sat.day) };
    }

    case 'nextweek': {
      // Next week: Mon–Sat
      const daysToMon = dow === 0 ? -6 : 1 - dow;
      const thisMon = addDays(year, month, day, daysToMon);
      const nextMon = addDays(thisMon.year, thisMon.month, thisMon.day, 7);
      const nextSat = addDays(nextMon.year, nextMon.month, nextMon.day, 5);
      return { from: utcDate(nextMon.year, nextMon.month, nextMon.day), to: utcDate(nextSat.year, nextSat.month, nextSat.day) };
    }

    case 'all':
      return { from: utcDate(year, month, day), to: utcDate(2030, 12, 31) };

    default:
      // Fall back to 7 days
      return resolveDatePreset('7days', ref);
  }
}
