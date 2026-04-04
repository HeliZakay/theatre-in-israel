"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/constants/reviewValidation";
import StarRating from "./StarRating";
import ExpressionChips from "./ExpressionChips";
import ShowNavBar from "./ShowNavBar";
import styles from "./ReviewStep.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ReviewStepProps {
  show: BatchShowItem;
  currentIndex: number;
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
  const [validationError, setValidationError] = useState<"rating" | "text" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevShowIdRef = useRef(show.id);

  // Reset local state when show changes (replaces key-driven remount)
  useEffect(() => {
    if (prevShowIdRef.current !== show.id) {
      prevShowIdRef.current = show.id;
      setRating(initialDraft?.rating ?? null);
      setText(initialDraft?.text ?? "");
      setValidationError(null);
    }
  }, [show.id, initialDraft]);

  // Sync draft changes back to parent (writes to a ref, no re-renders)
  useEffect(() => {
    onDraftChange?.(show.id, { rating, text });
  }, [rating, text, show.id, onDraftChange]);

  // Clear validation error when the user fills in the missing field
  useEffect(() => {
    if (validationError === "rating" && rating !== null) setValidationError(null);
    if (validationError === "text" && text.trim().length >= REVIEW_TEXT_MIN) setValidationError(null);
  }, [rating, text, validationError]);

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

  const handleNext = useCallback(() => {
    const hasRating = rating !== null;
    const hasText = text.trim().length >= REVIEW_TEXT_MIN;
    if (hasRating !== hasText) {
      setValidationError(hasRating ? "text" : "rating");
      return;
    }
    setValidationError(null);
    onNext();
  }, [rating, text, onNext]);

  const nextLabel = editingFromSummary
    ? "חזרה לסיכום"
    : isLast
      ? "סיום"
      : "הבא";

  return (
    <div className={styles.reviewStep}>
      <div key={show.id} className={`${styles.contentRow} ${styles.fadeSlideIn}`}>
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
            {validationError === "rating" && (
              <span className={styles.validationHint}>חסר דירוג כוכבים</span>
            )}
          </div>

          {/* Textarea */}
          <div className={styles.textSection}>
            <textarea
              ref={textareaRef}
              className={`${styles.textarea} ${validationError === "text" ? styles.textareaError : ""}`}
              rows={3}
              maxLength={REVIEW_TEXT_MAX}
              placeholder="במילה, במשפט, או בפסקה — הכל בסדר"
              value={text}
              onChange={handleTextChange}
            />
            {validationError === "text" && (
              <span className={styles.validationHint}>חסר טקסט לביקורת</span>
            )}
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
        <ShowNavBar
          shows={shows}
          selectedShowIds={selectedShowIds}
          currentIndex={currentIndex}
          completedShowIds={draftedShowIds}
          onJumpTo={onJumpTo}
          disabled={false}
          onNext={handleNext}
          nextLabel={nextLabel}
          onPrev={onPrev}
          isFirst={isFirst}
        />
      </div>
    </div>
  );
}
