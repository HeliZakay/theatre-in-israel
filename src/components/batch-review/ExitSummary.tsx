"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { showPath } from "@/constants/routes";
import { ROUTES } from "@/constants/routes";
import styles from "./ExitSummary.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = [
  "#9c1b20",
  "#d4a017",
  "#e8524a",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
];

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
/*  Confetti                                                           */
/* ------------------------------------------------------------------ */

function Confetti() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className={styles.confettiPiece}
          style={
            {
              "--x": `${4 + ((i * 4) % 92)}%`,
              "--delay": `${i * 0.12}s`,
              "--color": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--drift": `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 8)}px`,
            } as React.CSSProperties
          }
        />
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
  completedReviews: { showId: number; rating: number; text: string }[];
  shows: BatchShowItem[];
  isAuthenticated: boolean;
  onReviewMore: () => Promise<void>;
}

export default function ExitSummary({
  completedReviews,
  shows,
  isAuthenticated,
  onReviewMore,
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

  const hasReviews = completedReviews.length > 0;

  return (
    <div className={styles.exitSummary}>
      {hasReviews && <Confetti />}

      {/* Header */}
      <div className={styles.headerSection}>
        <h1
          ref={headingRef}
          className={styles.heading}
          tabIndex={-1}
          aria-live="polite"
        >
          {hasReviews ? "תודה על הביקורות!" : "אולי בפעם הבאה"}
        </h1>
        <p className={styles.subtitle}>
          {hasReviews ? (
            <>
              כתבתם{" "}
              <span className={styles.odometerCount} aria-hidden="true">
                {count}
              </span>
              <span className={styles.srOnly}>{completedReviews.length}</span>{" "}
              ביקורות — הקהילה מודה לכם
            </>
          ) : (
            "לא כתבתם ביקורות הפעם"
          )}
        </p>
      </div>

      {/* Review cards grid */}
      {hasReviews && (
        <div className={styles.reviewGrid} role="list">
          {completedReviews.map(({ showId, rating, text }, index) => {
            const show = shows.find((s) => s.id === showId);
            if (!show) return null;
            return (
              <div
                key={showId}
                className={styles.reviewCard}
                role="listitem"
                style={{ "--card-index": index } as React.CSSProperties}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.showPoster}>
                    <FallbackImage
                      src={getShowImagePath(show.title)}
                      alt={show.title}
                      fill
                      sizes="56px"
                      className={styles.showImage}
                    />
                  </div>
                  <div className={styles.showInfo}>
                    <span className={styles.showTitle}>{show.title}</span>
                    <MiniStars rating={rating} />
                    {isAuthenticated && (
                      <Link
                        href={showPath(show.slug)}
                        className={styles.editLink}
                      >
                        עריכה
                      </Link>
                    )}
                  </div>
                </div>
                {text && text.length > 5 && (
                  <p className={styles.reviewSnippet}>{text}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTAs */}
      <div className={styles.ctaRow}>
        <button
          className={styles.reviewMoreButton}
          onClick={handleReviewMore}
          disabled={loading}
        >
          {loading && <span className={styles.spinner} aria-hidden="true" />}
          לביקורות נוספות
        </button>
        <Link href={ROUTES.SHOWS} className={styles.exploreButton}>
          גלו הצגות נוספות
        </Link>
      </div>
    </div>
  );
}
