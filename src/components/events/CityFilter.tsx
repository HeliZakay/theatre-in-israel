"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import AppSelect from "@/components/ui/AppSelect/AppSelect";
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

const ALL_VALUE = "__all__";

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

  const options = useMemo(() => {
    const opts = [{ value: ALL_VALUE, label: "כל הערים" }];
    for (const city of allCities) {
      const slug = LATIN_SLUG_BY_NAME.get(city.name) ?? cityNameToSlug(city.name);
      opts.push({ value: slug, label: city.name });
    }
    return opts;
  }, [allCities]);

  const value = citySlug && options.some((o) => o.value === citySlug)
    ? citySlug
    : ALL_VALUE;

  const handleChange = (next: string) => {
    const selected = next === ALL_VALUE ? undefined : next;
    router.push(buildFilterUrl(datePreset, selected, theatre));
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.prefix} aria-hidden="true">
        או בחרו עיר ספציפית
      </span>
      <AppSelect
        id="city-filter"
        ariaLabel="סינון לפי עיר ספציפית"
        value={value}
        onValueChange={handleChange}
        options={options}
      />
    </div>
  );
}
