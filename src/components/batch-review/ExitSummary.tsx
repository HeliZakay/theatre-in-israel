"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { showPath } from "@/constants/routes";
import styles from "./ExitSummary.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

/* ------------------------------------------------------------------ */
/*  Star display (small, non-interactive)                              */
/* ------------------------------------------------------------------ */

function MiniStars({ rating }: { rating: number }) {
  return (
    <div className={styles.stars} aria-label={`${rating} מתוך 5 כוכבים`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={styles.star}
          viewBox="0 0 24 24"
          fill={i <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i <= rating ? 0 : 1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Odometer count-up                                                  */
/* ------------------------------------------------------------------ */

function useOdometer(target: number, durationMs = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReduced || target === 0) {
      // Use rAF callback to avoid synchronous setState in effect
      const id = requestAnimationFrame(() => setValue(target));
      return () => cancelAnimationFrame(id);
    }

    const start = performance.now();
    let animId: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(eased * target));

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    }

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [target, durationMs]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  ExitSummary                                                        */
/* ------------------------------------------------------------------ */

interface ExitSummaryProps {
  completedReviews: { showId: number; rating: number }[];
  skippedShowIds: number[];
  shows: BatchShowItem[];
  isAuthenticated: boolean;
  onReviewMore: () => Promise<void>;
  onReviewSkipped: (showId: number) => void;
}

export default function ExitSummary({
  completedReviews,
  skippedShowIds,
  shows,
  isAuthenticated,
  onReviewMore,
  onReviewSkipped,
}: ExitSummaryProps) {
  const [loading, setLoading] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const count = useOdometer(completedReviews.length);

  // Focus heading on mount for a11y
  useEffect(() => {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }, []);

  const handleReviewMore = async () => {
    setLoading(true);
    try {
      await onReviewMore();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.exitSummary}>
      <h1
        ref={headingRef}
        className={styles.heading}
        tabIndex={-1}
        aria-live="polite"
      >
        ביקרתם{" "}
        <span className={styles.odometerCount} aria-hidden="true">
          {count}
        </span>
        <span className={styles.srOnly}>{completedReviews.length}</span> הצגות!
      </h1>

      <div className={styles.showList} role="list">
        {completedReviews.map(({ showId, rating }) => {
          const show = shows.find((s) => s.id === showId);
          if (!show) return null;
          return (
            <div key={showId} className={styles.showRow} role="listitem">
              <div className={styles.showPoster}>
                <FallbackImage
                  src={getShowImagePath(show.title)}
                  alt={show.title}
                  fill
                  sizes="40px"
                  className={styles.showImage}
                />
              </div>
              <div className={styles.showInfo}>
                <span className={styles.showTitle}>{show.title}</span>
                <MiniStars rating={rating} />
                <Link href={showPath(show.slug)} className={styles.viewLink}>
                  צפו בביקורת
                </Link>
              </div>
              {isAuthenticated && (
                <Link href={showPath(show.slug)} className={styles.editLink}>
                  עריכה
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {skippedShowIds.length > 0 && (
        <div className={styles.skippedSection}>
          <h2 className={styles.skippedHeading}>הצגות שדילגתם עליהן</h2>
          <div className={styles.showList} role="list">
            {skippedShowIds.map((showId) => {
              const show = shows.find((s) => s.id === showId);
              if (!show) return null;
              return (
                <div key={showId} className={styles.showRow} role="listitem">
                  <div className={styles.showPoster}>
                    <FallbackImage
                      src={getShowImagePath(show.title)}
                      alt={show.title}
                      fill
                      sizes="40px"
                      className={styles.showImage}
                    />
                  </div>
                  <div className={styles.showInfo}>
                    <span className={styles.showTitle}>{show.title}</span>
                  </div>
                  <button
                    className={styles.reviewSkippedButton}
                    onClick={() => onReviewSkipped(showId)}
                  >
                    כתבו ביקורת
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        className={styles.reviewMoreButton}
        onClick={handleReviewMore}
        disabled={loading}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        לביקורות נוספות
      </button>
    </div>
  );
}
