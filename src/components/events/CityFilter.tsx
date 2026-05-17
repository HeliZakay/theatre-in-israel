"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import CityCombobox from "./CityCombobox";
import { CITY_SLUGS } from "@/lib/eventsConstants";
import { cityNameToSlug } from "@/constants/cities";
import { buildFilterUrl } from "./buildFilterUrl";
import styles from "./CityFilter.module.css";

interface CityFilterProps {
  allCities: { slug: string; name: string }[];
  citySlug?: string;
  datePreset: string;
  theatre?: string;
}

/** Map canonical Hebrew name → Latin SEO slug for the 3 indexed cities. */
const LATIN_SLUG_BY_NAME = new Map<string, string>(
  Object.entries(CITY_SLUGS).flatMap(([latinSlug, aliases]) =>
    aliases.map((a) => [a, latinSlug] as const),
  ),
);

export default function CityFilter({
  allCities,
  citySlug,
  datePreset,
  theatre,
}: CityFilterProps) {
  const router = useRouter();

  const options = useMemo(
    () =>
      allCities.map((city) => ({
        value: LATIN_SLUG_BY_NAME.get(city.name) ?? cityNameToSlug(city.name),
        label: city.name,
      })),
    [allCities],
  );

  const value = citySlug && options.some((o) => o.value === citySlug)
    ? citySlug
    : "";

  const handleChange = (next: string) => {
    router.push(buildFilterUrl(datePreset, next || undefined, theatre));
  };

  const handleClear = () => {
    router.push(buildFilterUrl(datePreset, undefined, theatre));
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.prefix} aria-hidden="true">
        או בחרו עיר ספציפית
      </span>
      <CityCombobox
        id="city-filter"
        ariaLabel="חיפוש עיר"
        options={options}
        value={value}
        onValueChange={handleChange}
        onClear={handleClear}
      />
    </div>
  );
}
