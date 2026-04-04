"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
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
  onPrev: () => void;
  isFirst: boolean;
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

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function PrevArrowIcon() {
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
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
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
  onPrev,
  isFirst,
}: ShowNavBarProps) {
  const [stripOpen, setStripOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const totalCount = selectedShowIds.length;
  const currentShowId = selectedShowIds[currentIndex];
  const currentShow = shows.find((s) => s.id === currentShowId);

  // Close panel on outside click
  useEffect(() => {
    if (!stripOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setStripOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [stripOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!stripOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setStripOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [stripOpen]);

  const handleJumpTo = useCallback(
    (index: number) => {
      setStripOpen(false);
      onJumpTo(index);
    },
    [onJumpTo],
  );

  const handleSegmentClick = useCallback(
    (index: number) => {
      onJumpTo(index);
    },
    [onJumpTo],
  );

  const buttonIcon =
    nextLabel === "סיום" ? (
      <CheckIcon />
    ) : nextLabel === "חזרה לסיכום" ? (
      <ReturnIcon />
    ) : (
      <ArrowIcon />
    );

  return (
    <nav
      className={styles.container}
      aria-label={`ניווט ביקורות: ${currentIndex + 1} מתוך ${totalCount}`}
    >
      {/* Expand panel (thumbnail strip, rendered above the bar) */}
      {stripOpen && (
        <>
          <div
            className={styles.expandBackdrop}
            onClick={() => setStripOpen(false)}
            aria-hidden="true"
          />
          <div className={styles.expandPanel} ref={panelRef}>
            <ShowNavStrip
              shows={shows}
              selectedShowIds={selectedShowIds}
              currentIndex={currentIndex}
              completedShowIds={completedShowIds}
              onJumpTo={handleJumpTo}
              disabled={disabled}
              compact
            />
          </div>
        </>
      )}

      {/* Row 1: Prev button + progress bar + Next button */}
      <div className={styles.progressRow}>
        <button
          className={styles.prevButton}
          onClick={onPrev}
          disabled={disabled || isFirst}
          aria-label="הקודם"
        >
          <PrevArrowIcon />
          <span>הקודם</span>
        </button>

        <div
          className={styles.segmentRow}
          role="tablist"
          aria-label="ניווט בין הצגות"
        >
          {selectedShowIds.map((showId, index) => {
            const show = shows.find((s) => s.id === showId);
            const isCurrent = index === currentIndex;
            const isCompleted = completedShowIds.has(showId);

            return (
              <button
                key={showId}
                role="tab"
                aria-selected={isCurrent}
                aria-label={`${show?.title ?? `הצגה ${index + 1}`}${isCompleted ? " (נכתבה ביקורת)" : ""}`}
                className={`${styles.segment} ${isCurrent ? styles.segmentCurrent : ""} ${isCompleted && !isCurrent ? styles.segmentCompleted : ""}`}
                onClick={() => handleSegmentClick(index)}
                disabled={disabled}
              />
            );
          })}
        </div>

        <button
          className={styles.actionButton}
          onClick={onNext}
          disabled={disabled}
        >
          <span>{nextLabel}</span>
          {buttonIcon}
        </button>
      </div>

      {/* Row 2: Current show context */}
      <div className={styles.contextRow}>
        <button
          className={`${styles.currentShowButton} ${stripOpen ? styles.expandIndicatorOpen : ""}`}
          onClick={() => setStripOpen((prev) => !prev)}
          aria-expanded={stripOpen}
          aria-label={`${currentShow?.title ?? ""} — לחצו לניווט בין הצגות`}
        >
          <div className={styles.currentThumb}>
            {currentShow && (
              <FallbackImage
                src={getShowImagePath(currentShow.title)}
                alt=""
                fill
                sizes="32px"
                className={styles.currentThumbImage}
              />
            )}
          </div>
          <div className={styles.currentShowInfo}>
            <span className={styles.currentShowTitle}>
              {currentShow?.title}
            </span>
            <span className={styles.currentShowCount}>
              {currentIndex + 1} מתוך {totalCount}
            </span>
          </div>
          <ChevronDownIcon className={styles.expandIndicatorIcon} />
        </button>
      </div>
    </nav>
  );
}
