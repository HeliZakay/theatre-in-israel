import { DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { eventsPath } from "@/constants/routes";

export function buildFilterUrl(
  datePreset: string | undefined,
  locationSlug: string | undefined,
  theatre?: string,
): string {
  const segments: string[] = [];
  if (datePreset && datePreset !== DEFAULT_DATE_PRESET) segments.push(datePreset);
  if (locationSlug) segments.push(locationSlug);
  const base = eventsPath(segments);
  if (theatre) return `${base}?theatre=${encodeURIComponent(theatre)}`;
  return base;
}
