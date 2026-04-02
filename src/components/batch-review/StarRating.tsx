"use client";

import { useState, useCallback } from "react";
import styles from "./StarRating.module.css";
import { cx } from "@/utils/cx";

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}

function StarIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function StarRating({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback(
    (index: number) => {
      if (!disabled) setHoverIndex(index);
    },
    [disabled],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIndex(null);
  }, []);

  const handleClick = useCallback(
    (index: number) => {
      if (disabled) return;
      // Tap same star to clear
      onChange(value === index ? null : index);
    },
    [disabled, onChange, value],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (disabled) return;
      // RTL: ArrowRight = lower star, ArrowLeft = higher star
      if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = index + 1;
        if (next <= 5) {
          onChange(next);
          const nextButton = (e.currentTarget as HTMLElement)
            .nextElementSibling as HTMLElement;
          nextButton?.focus();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = index - 1;
        if (prev >= 1) {
          onChange(prev);
          const prevButton = (e.currentTarget as HTMLElement)
            .previousElementSibling as HTMLElement;
          prevButton?.focus();
        }
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        onChange(null);
      }
    },
    [disabled, onChange],
  );

  // Stars rendered 5→1 for RTL fill (right to left visually)
  const stars = [5, 4, 3, 2, 1];

  return (
    <div
      className={styles.container}
      role="radiogroup"
      aria-label="דירוג"
      onMouseLeave={handleMouseLeave}
    >
      {stars.map((starIndex) => {
        const isActive =
          hoverIndex !== null
            ? starIndex <= hoverIndex
            : value !== null && starIndex <= value;
        const isHovering = hoverIndex !== null && starIndex <= hoverIndex;

        return (
          <button
            key={starIndex}
            type="button"
            className={styles.star}
            role="radio"
            aria-checked={value === starIndex}
            aria-label={`${starIndex} מתוך 5`}
            tabIndex={
              value === starIndex || (value === null && starIndex === 5)
                ? 0
                : -1
            }
            disabled={disabled}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onKeyDown={(e) => handleKeyDown(e, starIndex)}
          >
            <StarIcon
              className={cx(
                styles.starSvg,
                isHovering
                  ? styles.starHover
                  : isActive
                    ? styles.starFilled
                    : styles.starEmpty,
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
