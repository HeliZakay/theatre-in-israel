"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import Tag from "@/components/Tag/Tag";
import { showPath } from "@/constants/routes";
import ROUTES from "@/constants/routes";
import { getShowImagePath } from "@/utils/getShowImagePath";
import type { ExploreBannerShow } from "@/lib/data/homepage";
import { cx } from "@/utils/cx";
import styles from "./ExploreBanner.module.css";

function pickRandom(
  pool: ExploreBannerShow[],
  count: number,
): ExploreBannerShow[] {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

interface ExploreBannerGridProps {
  pool: ExploreBannerShow[];
  initial: ExploreBannerShow[];
}

export default function ExploreBannerGrid({
  pool,
  initial,
}: ExploreBannerGridProps) {
  const [visible, setVisible] = useState<ExploreBannerShow[]>(initial);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShuffle = useCallback(() => {
    setFading(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(pickRandom(pool, 4));
      setFading(false);
    }, 200);
  }, [pool]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className={styles.shuffleRow}>
        <button
          type="button"
          className={styles.shuffleButton}
          onClick={handleShuffle}
          aria-label="ערבבו שוב"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={styles.shuffleIcon}
          >
            <path d="M16 3h5v5" />
            <path d="M4 20 21 3" />
            <path d="M21 16v5h-5" />
            <path d="M15 15l6 6" />
            <path d="M4 4l5 5" />
          </svg>
          ערבבו שוב
        </button>
        <Link href={ROUTES.SHOWS} className={styles.browseLink}>
          לכל ההצגות ←
        </Link>
      </div>
      <div className={cx(styles.grid, fading && styles.gridFading)}>
        {visible.map((show) => (
          <Link
            key={show.id}
            href={showPath(show.slug)}
            className={styles.cardLink}
          >
            <div className={styles.card}>
              <div className={styles.thumb}>
                <FallbackImage
                  src={getShowImagePath(show.title)}
                  alt={show.title}
                  fill
                  className={styles.thumbImage}
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                />
              </div>
              <div className={styles.cardBody}>
                <span className={styles.cardTitle}>{show.title}</span>
                <span className={styles.cardMeta}>{show.theatre}</span>
                {show.genre.length > 0 && (
                  <div className={styles.cardGenres}>
                    {show.genre.slice(0, 2).map((g) => (
                      <Tag key={g}>{g}</Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
