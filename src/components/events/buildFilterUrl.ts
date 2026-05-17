import { DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { eventsPath } from "@/constants/routes";

export function buildFilterUrl(
  datePreset: string | undefined,
  locationSlug: string | undefined,
  theatre?: string,
  venue?: string,
): string {
  const segments: string[] = [];
  if (datePreset && datePreset !== DEFAULT_DATE_PRESET) segments.push(datePreset);
  if (locationSlug) segments.push(locationSlug);
  const base = eventsPath(segments);
  const params: string[] = [];
  if (theatre) params.push(`theatre=${encodeURIComponent(theatre)}`);
  if (venue) params.push(`venue=${encodeURIComponent(venue)}`);
  return params.length > 0 ? `${base}?${params.join("&")}` : base;
}
