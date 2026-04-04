"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_TEXT_MAX } from "@/constants/reviewValidation";
import StarRating from "./StarRating";
import ExpressionChips from "./ExpressionChips";
import ShowNavStrip from "./ShowNavStrip";
import styles from "./ReviewStep.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ReviewStepProps {
  show: BatchShowItem;
  currentIndex: number;
  totalCount: number;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  editingFromSummary: boolean;
  shows: BatchShowItem[];
  selectedShowIds: number[];
  onJumpTo: (index: number) => void;
  draftedShowIds: Set<number>;
  initialDraft?: { rating: number | null; text: string };
  onDraftChange?: (showId: number, draft: { rating: number | null; text: string }) => void;
}

export default function ReviewStep({
  show,
  currentIndex,
  totalCount,
  onNext,
  onPrev,
  isFirst,
  isLast,
  editingFromSummary,
  shows,
  selectedShowIds,
  onJumpTo,
  draftedShowIds,
  initialDraft,
  onDraftChange,
}: ReviewStepProps) {
  const [rating, setRating] = useState<number | null>(initialDraft?.rating ?? null);
  const [text, setText] = useState(initialDraft?.text ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft changes back to parent (writes to a ref, no re-renders)
  useEffect(() => {
    onDraftChange?.(show.id, { rating, text });
  }, [rating, text, show.id, onDraftChange]);

  const showCharCount = text.length > 500;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    [],
  );

  const handleChipTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const nextLabel = editingFromSummary
    ? "חזרה לסיכום"
    : isLast
      ? "סיום"
      : "הבא";

  return (
    <div className={styles.reviewStep}>
      <div className={styles.contentRow}>
        {/* Show card */}
        <div className={styles.showCard}>
          <div className={styles.showPoster}>
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt={show.title}
              fill
              sizes="(min-width: 768px) 280px, 100vw"
              className={styles.showImage}
            />
          </div>
        </div>

        {/* Review form */}
        <div className={styles.formColumn}>
          <div className={styles.showInfo}>
            <h2 className={styles.showTitle}>{show.title}</h2>
            <span className={styles.showTheatre}>{show.theatre}</span>
          </div>

          {/* Star rating */}
          <div className={styles.ratingSection}>
            <StarRating value={rating} onChange={setRating} disabled={false} />
          </div>

          {/* Textarea */}
          <div className={styles.textSection}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              rows={3}
              maxLength={REVIEW_TEXT_MAX}
              placeholder="במילה, במשפט, או בפסקה — הכל בסדר"
              value={text}
              onChange={handleTextChange}
              onFocus={(e) => {
                e.currentTarget.rows = 6;
              }}
            />
            {showCharCount && (
              <span className={styles.charCount}>
                {text.length} / {REVIEW_TEXT_MAX}
              </span>
            )}
          </div>

          {/* Expression chips */}
          <ExpressionChips
            text={text}
            onTextChange={handleChipTextChange}
            disabled={false}
          />
        </div>
      </div>

      {/* Navigation bottom bar */}
      <div className={styles.bottomBar}>
        <div className={styles.navButtons}>
          {!isFirst && !editingFromSummary && (
            <button
              className={styles.prevButton}
              onClick={onPrev}
            >
              הקודם
            </button>
          )}
          <button
            className={styles.nextButton}
            onClick={onNext}
          >
            {nextLabel}
          </button>
        </div>
        {totalCount > 1 && (
          <ShowNavStrip
            shows={shows}
            selectedShowIds={selectedShowIds}
            currentIndex={currentIndex}
            completedShowIds={draftedShowIds}
            onJumpTo={onJumpTo}
            disabled={false}
          />
        )}
      </div>
    </div>
  );
}
