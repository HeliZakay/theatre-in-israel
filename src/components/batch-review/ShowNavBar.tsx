"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ShowNavStrip from "./ShowNavStrip";
import styles from "./ShowNavBar.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ShowNavBarProps {
  shows: BatchShowItem[];
  selectedShowIds: number[];
  currentIndex: number;
  completedShowIds: Set<number>;
  onJumpTo: (index: number) => void;
  disabled?: boolean;
  onNext: () => void;
  nextLabel: string;
}

function ChevronIcon({ direction }: { direction: "start" | "end" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={direction === "start" ? { transform: "scaleX(-1)" } : undefined}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg
      className={styles.buttonIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  );
}

export default function ShowNavBar({
  shows,
  selectedShowIds,
  currentIndex,
  completedShowIds,
  onJumpTo,
  disabled,
  onNext,
  nextLabel,
}: ShowNavBarProps) {
  const stripWrapperRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const totalCount = selectedShowIds.length;
  const completedCount = completedShowIds.size;

  const checkOverflow = useCallback(() => {
    const el = stripWrapperRef.current?.querySelector<HTMLElement>(
      '[role="tablist"]',
    );
    if (!el) return;
    // In RTL, scrollLeft is negative in some browsers
    const scrollPos = Math.abs(el.scrollLeft);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollStart(scrollPos > 2);
    setCanScrollEnd(maxScroll - scrollPos > 2);
  }, []);

  useEffect(() => {
    const el = stripWrapperRef.current?.querySelector<HTMLElement>(
      '[role="tablist"]',
    );
    if (!el) return;
    checkOverflow();
    el.addEventListener("scroll", checkOverflow, { passive: true });
    const ro = new ResizeObserver(checkOverflow);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      ro.disconnect();
    };
  }, [checkOverflow, selectedShowIds.length]);

  const scroll = (direction: "start" | "end") => {
    const el = stripWrapperRef.current?.querySelector<HTMLElement>(
      '[role="tablist"]',
    );
    if (!el) return;
    const amount = 58 * 3; // 3 thumbnails worth
    // In RTL, "start" means scrolling right (positive), "end" means left (negative)
    const isRtl = getComputedStyle(el).direction === "rtl";
    const sign =
      (direction === "end" ? 1 : -1) * (isRtl ? -1 : 1);
    el.scrollBy({ left: sign * amount, behavior: "smooth" });
  };

  const buttonIcon =
    nextLabel === "סיום" ? (
      <CheckIcon />
    ) : nextLabel === "חזרה לסיכום" ? (
      <ReturnIcon />
    ) : (
      <ArrowIcon />
    );

  return (
    <nav className={styles.container} aria-label={`ניווט ביקורות: ${currentIndex + 1} מתוך ${totalCount}`}>
      {/* Progress row */}
      <div className={styles.progressRow}>
        <span className={styles.progressLabel}>
          ביקורת {currentIndex + 1} מתוך {totalCount}
        </span>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${completedCount} מתוך ${totalCount} הושלמו`}
        >
          <div
            className={styles.progressFill}
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Thumbnail strip with scroll arrows */}
      <div className={styles.stripRow}>
        <button
          className={`${styles.scrollArrow} ${!canScrollStart ? styles.scrollArrowHidden : ""}`}
          onClick={() => scroll("start")}
          aria-label="הצגות נוספות"
          tabIndex={-1}
        >
          <ChevronIcon direction="start" />
        </button>

        <div className={styles.stripWrapper} ref={stripWrapperRef}>
          <ShowNavStrip
            shows={shows}
            selectedShowIds={selectedShowIds}
            currentIndex={currentIndex}
            completedShowIds={completedShowIds}
            onJumpTo={onJumpTo}
            disabled={disabled}
          />
        </div>

        <button
          className={`${styles.scrollArrow} ${!canScrollEnd ? styles.scrollArrowHidden : ""}`}
          onClick={() => scroll("end")}
          aria-label="הצגות נוספות"
          tabIndex={-1}
        >
          <ChevronIcon direction="end" />
        </button>
      </div>

      {/* Action button */}
      <button
        className={styles.actionButton}
        onClick={onNext}
        disabled={disabled}
      >
        <span>{nextLabel}</span>
        {buttonIcon}
      </button>
    </nav>
  );
}
