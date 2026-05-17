"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cityPath } from "@/constants/routes";
import styles from "./page.module.css";

interface City {
  name: string;
  slug: string;
  upcomingEventCount: number;
}

interface Props {
  cities: City[];
}

export default function CitiesSearchableList({ cities }: Props) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim();
    const filtered = q
      ? cities.filter((c) => c.name.includes(q))
      : cities;

    const byLetter = new Map<string, City[]>();
    for (const c of filtered) {
      const letter = c.name[0] ?? "";
      if (!byLetter.has(letter)) byLetter.set(letter, []);
      byLetter.get(letter)!.push(c);
    }
    return Array.from(byLetter.entries());
  }, [cities, query]);

  return (
    <>
      <div className={styles.searchRow}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש עיר..."
          aria-label="חיפוש עיר"
          className={styles.search}
        />
      </div>

      {groups.length === 0 ? (
        <p className={styles.empty}>לא נמצאו ערים תואמות</p>
      ) : (
        groups.map(([letter, items]) => (
          <section key={letter} className={styles.letterSection}>
            <h2 className={styles.letterHeading} aria-label={`ערים שמתחילות באות ${letter}`}>
              {letter}
            </h2>
            <ul className={styles.list}>
              {items.map((c) => (
                <li key={c.name} className={styles.listItem}>
                  <Link href={cityPath(c.slug)} className={styles.cityLink}>
                    <span className={styles.cityName}>{c.name}</span>
                    <span className={styles.cityCount}>
                      {c.upcomingEventCount > 0
                        ? `${c.upcomingEventCount} הופעות קרובות`
                        : "אין הופעות קרובות"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
