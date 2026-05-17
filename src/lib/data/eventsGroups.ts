import type { EventListItem } from "@/lib/data/eventsList";
import type { DateGroup } from "@/components/events/EventsList";
import type { DateTab } from "@/components/events/DateStrip";

export function groupByDate(events: EventListItem[]) {
  const groups: Map<string, EventListItem[]> = new Map();
  for (const event of events) {
    const dateKey = event.date.slice(0, 10);
    const group = groups.get(dateKey);
    if (group) {
      group.push(event);
    } else {
      groups.set(dateKey, [event]);
    }
  }
  return groups;
}

const hebrewDayFormatter = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Jerusalem",
});

const hebrewWeekdayFormatter = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  timeZone: "Asia/Jerusalem",
});

const hebrewDayNumFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  timeZone: "Asia/Jerusalem",
});

const hebrewMonthFormatter = new Intl.DateTimeFormat("he-IL", {
  month: "short",
  timeZone: "Asia/Jerusalem",
});

export function buildDateTab(
  dateKey: string,
  count: number,
  _todayKey: string,
  _tomorrowKey: string,
): DateTab {
  const d = new Date(dateKey + "T00:00:00Z");
  return {
    dateKey,
    dayName: hebrewWeekdayFormatter.format(d),
    dayNum: hebrewDayNumFormatter.format(d),
    monthName: hebrewMonthFormatter.format(d),
    label: "",
    count,
  };
}

export function formatDateHeader(
  dateKey: string,
  todayKey: string,
  tomorrowKey: string,
  count: number,
): string {
  const d = new Date(dateKey + "T00:00:00Z");
  const formatted = hebrewDayFormatter.format(d);

  let prefix = "";
  if (dateKey === todayKey) prefix = "היום · ";
  else if (dateKey === tomorrowKey) prefix = "מחר · ";

  const countLabel = count === 1 ? "הופעה אחת" : `${count} הופעות`;
  return `${prefix}${formatted} · ${countLabel}`;
}

export function getTodayTomorrowKeys(): { todayKey: string; tomorrowKey: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayKey = fmt.format(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = fmt.format(tomorrow);
  return { todayKey, tomorrowKey };
}

export function buildDateGroupsAndTabs(events: EventListItem[]): {
  dateGroupsFormatted: DateGroup[];
  dateTabs: DateTab[];
} {
  const dateGroups = groupByDate(events);
  const { todayKey, tomorrowKey } = getTodayTomorrowKeys();

  const dateGroupsFormatted: DateGroup[] = Array.from(dateGroups.entries()).map(
    ([dateKey, dayEvents]) => ({
      dateKey,
      label: formatDateHeader(dateKey, todayKey, tomorrowKey, dayEvents.length),
      events: dayEvents.map((event) => ({
        hour: event.hour,
        showTitle: event.showTitle,
        showSlug: event.showSlug,
        showTheatre: event.showTheatre,
        showAvgRating: event.showAvgRating,
        showReviewCount: event.showReviewCount,
        venueName: event.venueName,
        venueCity: event.venueCity,
      })),
    }),
  );

  const dateTabs: DateTab[] = Array.from(dateGroups.entries()).map(
    ([dateKey, dayEvents]) =>
      buildDateTab(dateKey, dayEvents.length, todayKey, tomorrowKey),
  );

  return { dateGroupsFormatted, dateTabs };
}
