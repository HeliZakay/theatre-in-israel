"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { showPath } from "@/constants/routes";
import { ROUTES } from "@/constants/routes";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import MiniStars from "./MiniStars";
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
/*  Stats Row                                                          */
/* ------------------------------------------------------------------ */

function getReviewerLabel(avgRating: number): string {
  if (avgRating >= 4.5) return "מבקר/ת נלהב/ת";
  if (avgRating >= 3.5) return "מבקר/ת נדיב/ה";
  if (avgRating >= 2.5) return "מבקר/ת מאוזנ/ת";
  return "מבקר/ת מדויק/ת";
}

function StatsRow({
  completedReviews,
}: {
  completedReviews: { rating: number }[];
}) {
  const avgRating =
    completedReviews.reduce((sum, r) => sum + r.rating, 0) /
    completedReviews.length;
  const label = getReviewerLabel(avgRating);

  return (
    <div className={styles.statsRow} aria-label="סטטיסטיקת ביקורות">
      <div className={styles.statPill} style={{ "--pill-index": 0 } as React.CSSProperties}>
        <span className={styles.statValue}>{completedReviews.length}</span>
        <span className={styles.statLabel}>ביקורות</span>
      </div>
      <div className={styles.statPill} style={{ "--pill-index": 1 } as React.CSSProperties}>
        <span className={styles.statValue}>
          {avgRating.toFixed(1)}
          <svg className={styles.statStar} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
        <span className={styles.statLabel}>ממוצע</span>
      </div>
      <div className={styles.statPill} style={{ "--pill-index": 2 } as React.CSSProperties}>
        <span className={styles.statValue}>{label}</span>
        <span className={styles.statLabel}>הסגנון שלכם</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Theatre Recommendations                                            */
/* ------------------------------------------------------------------ */

function TheatreRecommendations({
  completedReviews,
  shows,
}: {
  completedReviews: { showId: number }[];
  shows: BatchShowItem[];
}) {
  const recommendations = useMemo(() => {
    const reviewedIds = new Set(completedReviews.map((r) => r.showId));
    const reviewedTheatres = new Set(
      completedReviews
        .map((r) => shows.find((s) => s.id === r.showId)?.theatre)
        .filter(Boolean),
    );
    return shows
      .filter((s) => !reviewedIds.has(s.id) && reviewedTheatres.has(s.theatre))
      .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
      .slice(0, 10);
  }, [completedReviews, shows]);

  if (recommendations.length < 2) return null;

  return (
    <section className={styles.recsSection}>
      <SectionHeader title="עוד הצגות מאותם תיאטראות" />
      <ShowCarousel label="עוד הצגות מאותם תיאטראות">
        {recommendations.map((show, index) => (
          <div
            key={show.id}
            className={styles.recSlide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} מתוך ${recommendations.length}`}
          >
            <Link
              href={showPath(show.slug)}
              target="_blank"
              className={styles.recCard}
            >
              <div className={styles.recPoster}>
                <FallbackImage
                  src={getShowImagePath(show.title)}
                  alt={show.title}
                  fill
                  sizes="280px"
                  className={styles.showImage}
                />
              </div>
              <div className={styles.recBody}>
                <span className={styles.recTitle}>{show.title}</span>
                <span className={styles.recTheatre}>{show.theatre}</span>
                {show.avgRating && (
                  <span className={styles.recRating}>
                    {show.avgRating.toFixed(1)} ★
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Discovery Cards                                            */
/* ------------------------------------------------------------------ */

function FeatureCards() {
  return (
    <section className={styles.featureSection}>
      <div className={styles.featureGrid}>
        <Link href={ROUTES.EVENTS} target="_blank" className={styles.featureCard}>
          <span className={styles.featureIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <span className={styles.featureTitle}>הצגות השבוע</span>
          <span className={styles.featureDesc}>גלו מה מתרחש על הבמות</span>
        </Link>

        <Link href={ROUTES.THEATRES} target="_blank" className={styles.featureCard}>
          <span className={styles.featureIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </span>
          <span className={styles.featureTitle}>גלו לפי תיאטרון</span>
          <span className={styles.featureDesc}>כל התיאטראות במקום אחד</span>
        </Link>

        <Link href={ROUTES.GENRES} target="_blank" className={styles.featureCard}>
          <span className={styles.featureIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth={2.5} strokeLinecap="round" />
            </svg>
          </span>
          <span className={styles.featureTitle}>גלו לפי ז׳אנר</span>
          <span className={styles.featureDesc}>דרמה, קומדיה, מחזמר ועוד</span>
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ExitSummary                                                        */
/* ------------------------------------------------------------------ */

interface ExitSummaryProps {
  completedReviews: { showId: number; rating: number; text: string }[];
  shows: BatchShowItem[];
}

export default function ExitSummary({
  completedReviews,
  shows,
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

      {/* Stats row */}
      {hasReviews && <StatsRow completedReviews={completedReviews} />}

      {/* Review cards grid */}
      {hasReviews && (
        <div className={styles.reviewGrid} role="list">
          {completedReviews.map(({ showId, rating, text }, index) => {
            const show = shows.find((s) => s.id === showId);
            if (!show) return null;
            return (
              <Link
                key={showId}
                href={showPath(show.slug)}
                target="_blank"
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
                  </div>
                </div>
                {text && text.length > 5 && (
                  <p className={styles.reviewSnippet}>{text}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Theatre recommendations */}
      {hasReviews && (
        <TheatreRecommendations
          completedReviews={completedReviews}
          shows={shows}
        />
      )}

      {/* Feature discovery */}
      <FeatureCards />

      {/* CTA row */}
      <div className={styles.ctaRow}>
        <Link href={ROUTES.SHOWS} target="_blank" className={styles.exploreButton}>
          גלו הצגות נוספות
        </Link>
        <Link href={ROUTES.REVIEWS_BATCH} target="_blank" className={styles.secondaryButton}>
          כתבו עוד ביקורות
        </Link>
      </div>
    </div>
  );
}
