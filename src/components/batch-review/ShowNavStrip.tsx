"use client";

import { useRef, useEffect } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import styles from "./ShowNavStrip.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ShowNavStripProps {
  shows: BatchShowItem[];
  selectedShowIds: number[];
  currentIndex: number;
  completedShowIds: Set<number>;
  onJumpTo: (index: number) => void;
  disabled?: boolean;
}

export default function ShowNavStrip({
  shows,
  selectedShowIds,
  currentIndex,
  completedShowIds,
  onJumpTo,
  disabled,
}: ShowNavStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const currentThumbRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to keep current show visible
  useEffect(() => {
    currentThumbRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [currentIndex]);

  return (
    <div
      className={styles.strip}
      ref={stripRef}
      role="tablist"
      aria-label="ניווט בין הצגות"
    >
      {selectedShowIds.map((showId, index) => {
        const show = shows.find((s) => s.id === showId);
        if (!show) return null;
        const isCurrent = index === currentIndex;
        const isCompleted = completedShowIds.has(showId);

        return (
          <button
            key={showId}
            ref={isCurrent ? currentThumbRef : undefined}
            role="tab"
            aria-selected={isCurrent}
            aria-label={`${show.title}${isCompleted ? " (נכתבה ביקורת)" : ""}`}
            className={`${styles.thumb} ${isCurrent ? styles.thumbCurrent : ""} ${isCompleted ? styles.thumbCompleted : ""}`}
            onClick={() => onJumpTo(index)}
            disabled={disabled}
          >
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt=""
              fill
              sizes="48px"
              className={styles.thumbImage}
            />
            {isCompleted && (
              <span className={styles.checkBadge} aria-hidden="true">
                <svg
                  className={styles.checkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
