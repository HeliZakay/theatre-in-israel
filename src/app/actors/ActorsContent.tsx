"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ActorSearch from "@/components/ui/ActorSearch/ActorSearch";
import { actorPath } from "@/constants/routes";
import type { ActorInfo } from "@/constants/actors";
import styles from "./page.module.css";

interface ActorStats {
  name: string;
  showCount: number;
}

interface ActorsContentProps {
  actors: ActorInfo[];
  stats: ActorStats[];
}

export default function ActorsContent({ actors, stats }: ActorsContentProps) {
  const [query, setQuery] = useState("");

  const names = useMemo(() => actors.map((a) => a.name), [actors]);
  const statsMap = useMemo(
    () => new Map(stats.map((s) => [s.name, s])),
    [stats],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return actors;
    const q = query.toLowerCase();
    return actors.filter((a) => a.name.toLowerCase().includes(q));
  }, [actors, query]);

  return (
    <>
      <ActorSearch names={names} value={query} onChange={setQuery} />
      <div className={styles.grid}>
        {filtered.map((a) => {
          const stat = statsMap.get(a.name);
          return (
            <Link
              key={a.slug}
              href={actorPath(a.slug)}
              className={styles.card}
            >
              <Image
                src={a.image}
                alt={a.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                className={styles.cardImage}
              />
              <div className={styles.cardOverlay}>
                <h2 className={styles.cardTitle}>{a.name}</h2>
                {stat && stat.showCount > 0 ? (
                  <div className={styles.cardStats}>
                    <span>{stat.showCount} הצגות</span>
                  </div>
                ) : (
                  <span className={styles.cardStats}>אין הצגות כרגע</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
