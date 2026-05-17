"use client";

import { useMemo, useState } from "react";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import type { ShowListItem } from "@/types";
import styles from "./TheatreShowFilters.module.css";

type SortKey = "upcoming" | "rating" | "reviews" | "newest";

interface Props {
  shows: ShowListItem[];
}

const SORT_LABELS: Record<SortKey, string> = {
  upcoming: "הופעה קרובה",
  rating: "דירוג גבוה",
  reviews: "הכי הרבה ביקורות",
  newest: "הצגות חדשות",
};

function compareShows(a: ShowListItem, b: ShowListItem, sort: SortKey): number {
  switch (sort) {
    case "rating": {
      const ar = a.avgRating ?? -Infinity;
      const br = b.avgRating ?? -Infinity;
      if (br !== ar) return br - ar;
      return b.reviewCount - a.reviewCount;
    }
    case "reviews":
      return b.reviewCount - a.reviewCount;
    case "newest": {
      if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
      return b.id - a.id;
    }
    case "upcoming":
    default: {
      const ad = a.nextEvent?.date ?? null;
      const bd = b.nextEvent?.date ?? null;
      if (ad && bd) return ad.localeCompare(bd);
      if (ad) return -1;
      if (bd) return 1;
      return 0;
    }
  }
}

export default function TheatreShowFilters({ shows }: Props) {
  const [sort, setSort] = useState<SortKey>("upcoming");
  const [onlyPlaying, setOnlyPlaying] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    for (const show of shows) {
      for (const g of show.genre) set.add(g);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
  }, [shows]);

  const showGenreChips = availableGenres.length >= 3;

  const filtered = useMemo(() => {
    const result = shows.filter((show) => {
      if (onlyPlaying && !show.nextEvent) return false;
      if (selectedGenres.size > 0) {
        const hasMatch = show.genre.some((g) => selectedGenres.has(g));
        if (!hasMatch) return false;
      }
      return true;
    });
    return result.sort((a, b) => compareShows(a, b, sort));
  }, [shows, sort, onlyPlaying, selectedGenres]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  const resetFilters = () => {
    setOnlyPlaying(false);
    setSelectedGenres(new Set());
    setSort("upcoming");
  };

  const playingCount = useMemo(
    () => shows.filter((s) => s.nextEvent).length,
    [shows],
  );

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.filterForm}>
          <label className={styles.filterGroup}>
            <span className={styles.filterLabel}>מיון:</span>
            <select
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
          </label>

          {playingCount > 0 && playingCount < shows.length && (
            <button
              type="button"
              className={styles.chip}
              data-state={onlyPlaying ? "on" : "off"}
              onClick={() => setOnlyPlaying((v) => !v)}
              aria-pressed={onlyPlaying}
            >
              על הבמה כעת ({playingCount})
            </button>
          )}
        </div>

        {showGenreChips && (
          <div className={styles.chipRow}>
            <span className={styles.filterLabel}>ז&apos;אנר:</span>
            {availableGenres.map((genre) => {
              const active = selectedGenres.has(genre);
              return (
                <button
                  key={genre}
                  type="button"
                  className={styles.chip}
                  data-state={active ? "on" : "off"}
                  onClick={() => toggleGenre(genre)}
                  aria-pressed={active}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className={styles.grid}>
          {filtered.map((show, i) => (
            <ShowCard key={show.id} show={show} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>אין הצגות התואמות לסינון.</p>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetFilters}
          >
            איפוס סינון
          </button>
        </div>
      )}
    </>
  );
}
