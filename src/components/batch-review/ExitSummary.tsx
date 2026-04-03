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
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#f97316",
  "#e11d48",
  "#06b6d4",
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
    const timer = setTimeout(() => setVisible(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.confettiContainer} aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => {
        const x = ((i * 17 + i * i * 3) % 96) + 2;

        const shapeType = i % 4;
        let w: number, h: number, radius: string;
        if (shapeType === 0) {
          w = 8 + (i % 5) * 1.5;
          h = w * 0.5;
          radius = "1px";
        } else if (shapeType === 1) {
          const size = 6 + (i % 4) * 2;
          w = size;
          h = size;
          radius = "2px";
        } else if (shapeType === 2) {
          w = 3 + (i % 3);
          h = 10 + (i % 4) * 2;
          radius = "1px";
        } else {
          const size = 5 + (i % 4) * 1.5;
          w = size;
          h = size;
          radius = "50%";
        }

        const y = (i % 4) * -1;
        const wave = Math.floor(i / 40);
        const delay = wave * 0.35 + (i % 10) * 0.04;
        const duration = 3 + ((i * 7) % 25) / 10;
        const sway = (15 + ((i * 13) % 46)) * (i % 2 === 0 ? 1 : -1);
        const rz = 180 + ((i * 11) % 900);
        const ry = 180 + ((i * 23) % 540);

        return (
          <span
            key={i}
            className={styles.confettiPiece}
            style={
              {
                "--x": `${x}%`,
                "--y": `${y}vh`,
                "--delay": `${delay}s`,
                "--color": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                "--w": `${w}px`,
                "--h": `${h}px`,
                "--radius": radius,
                "--duration": `${duration}s`,
                "--sway": `${sway}px`,
                "--rz": `${rz}deg`,
                "--ry": `${ry}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
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
}

export default function ExitSummary({
  completedReviews,
  shows,
  isAuthenticated,
}: ExitSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const count = useOdometer(completedReviews.length);

  // Focus heading on mount for a11y
  useEffect(() => {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }, []);

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

      {/* CTA */}
      <div className={styles.ctaRow}>
        <Link href={ROUTES.SHOWS} className={styles.exploreButton}>
          גלו הצגות נוספות
        </Link>
      </div>
    </div>
  );
}
