"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import CityCombobox from "./CityCombobox";
import { THEATRES } from "@/constants/theatres";
import { buildFilterUrl } from "./buildFilterUrl";
import styles from "./TheatreFilter.module.css";

interface TheatreFilterProps {
  datePreset: string;
  locationSlug?: string;
  venue?: string;
  theatre?: string;
}

export default function TheatreFilter({
  datePreset,
  locationSlug,
  venue,
  theatre,
}: TheatreFilterProps) {
  const router = useRouter();

  const options = useMemo(
    () =>
      THEATRES.map((t) => ({
        value: t.name,
        label: t.name,
      })),
    [],
  );

  const value = theatre && options.some((o) => o.value === theatre)
    ? theatre
    : "";

  const handleChange = (next: string) => {
    router.push(buildFilterUrl(datePreset, locationSlug, next || undefined, venue));
  };

  const handleClear = () => {
    router.push(buildFilterUrl(datePreset, locationSlug, undefined, venue));
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.prefix} aria-hidden="true">
        או בחרו תיאטרון ספציפי
      </span>
      <CityCombobox
        id="theatre-filter"
        ariaLabel="חיפוש תיאטרון"
        placeholder="חפשו תיאטרון…"
        options={options}
        value={value}
        onValueChange={handleChange}
        onClear={handleClear}
      />
    </div>
  );
}
