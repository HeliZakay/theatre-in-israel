import { DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { eventsPath } from "@/constants/routes";

export function buildFilterUrl(
  datePreset: string | undefined,
  locationSlug: string | undefined,
): string {
  const segments: string[] = [];
  if (datePreset && datePreset !== DEFAULT_DATE_PRESET) segments.push(datePreset);
  if (locationSlug) segments.push(locationSlug);
  return eventsPath(segments);
}
