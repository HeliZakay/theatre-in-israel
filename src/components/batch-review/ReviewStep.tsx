"use client";

import { useState, useCallback, useRef } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/constants/reviewValidation";
import StarRating from "./StarRating";
import ExpressionChips from "./ExpressionChips";
import ShowNavStrip from "./ShowNavStrip";
import styles from "./ReviewStep.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ReviewStepProps {
  show: BatchShowItem;
  currentIndex: number;
  totalCount: number;
  submissionStatus: "idle" | "pending" | "confirmed" | "error";
  errorMessage: string;
  onSubmitted: (showId: number, rating: number, text: string) => void;
  onSkip: () => void;
  onFinish: () => void;
  completedReview?: { showId: number; rating: number; text: string };
  shows: BatchShowItem[];
  selectedShowIds: number[];
  completedReviews: { showId: number; rating: number; text: string }[];
  onJumpTo: (index: number) => void;
  hasNextUnreviewed: boolean;
}

export default function ReviewStep({
  show,
  currentIndex,
  totalCount,
  submissionStatus,
  errorMessage: externalError,
  onSubmitted,
  onSkip,
  onFinish,
  completedReview,
  shows,
  selectedShowIds,
  completedReviews,
  onJumpTo,
  hasNextUnreviewed,
}: ReviewStepProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReadOnly = !!completedReview;
  const displayRating = isReadOnly ? completedReview.rating : rating;
  const displayText = isReadOnly ? completedReview.text : text;

  const completedShowIds = new Set(completedReviews.map((r) => r.showId));

  const progress = ((currentIndex + 1) / totalCount) * 100;
  const isPending = submissionStatus === "pending";
  const isConfirmed = submissionStatus === "confirmed";
  const isDisabled = isPending || isConfirmed || isReadOnly;
  const showCharCount = !isReadOnly && text.length > 500;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    [],
  );

  const handleChipTextChange = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleSubmit = () => {
    if (!rating) return;
    onSubmitted(show.id, rating, text);
  };

  const handleSkip = () => {
    setRating(null);
    setText("");
    onSkip();
  };

  return (
    <div className={styles.reviewStep}>
      {/* Confirmed toast overlay */}
      {isConfirmed && (
        <div className={styles.toastOverlay}>
          <div className={styles.toast}>
            <svg className={styles.toastCheck} viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className={styles.toastText}>פורסמה!</span>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressContent}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText} role="status">
            ביקורת {currentIndex + 1} מתוך {totalCount}
          </span>
        </div>
      </div>

      {/* Show navigation strip */}
      {totalCount > 1 && (
        <ShowNavStrip
          shows={shows}
          selectedShowIds={selectedShowIds}
          currentIndex={currentIndex}
          completedShowIds={completedShowIds}
          onJumpTo={onJumpTo}
          disabled={isPending || isConfirmed}
        />
      )}

      {/* Show card */}
      <div className={styles.showCard}>
        <div className={styles.showPoster}>
          <FallbackImage
            src={getShowImagePath(show.title)}
            alt={show.title}
            fill
            sizes="60px"
            className={styles.showImage}
          />
        </div>
        <div className={styles.showInfo}>
          <h2 className={styles.showTitle}>{show.title}</h2>
          <span className={styles.showTheatre}>{show.theatre}</span>
        </div>
      </div>

      {/* Star rating */}
      <div className={styles.ratingSection}>
        <StarRating value={displayRating} onChange={setRating} disabled={isDisabled} />
      </div>

      {/* Textarea */}
      <div className={styles.textSection}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          rows={3}
          maxLength={REVIEW_TEXT_MAX}
          placeholder="במילה, במשפט, או בפסקה — הכל בסדר"
          value={displayText}
          onChange={handleTextChange}
          disabled={isDisabled}
          readOnly={isReadOnly}
          onFocus={(e) => {
            if (!isReadOnly) e.currentTarget.rows = 6;
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
        text={displayText}
        onTextChange={handleChipTextChange}
        disabled={isDisabled}
      />

      {/* Error */}
      {externalError && (
        <p className={styles.error} role="alert">
          {externalError}
        </p>
      )}

      {/* Sticky bottom bar */}
      <div className={styles.bottomBar}>
        {isReadOnly ? (
          <>
            <span className={styles.reviewedLabel}>נכתבה ביקורת</span>
            <button
              className={styles.finishButton}
              onClick={onFinish}
            >
              סיום
            </button>
          </>
        ) : (
          <>
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!rating || text.length < REVIEW_TEXT_MIN || isDisabled}
            >
              {isPending ? "שולח..." : "שלח ביקורת"}
            </button>
            <div className={styles.secondaryActions}>
              {hasNextUnreviewed && (
                <button
                  className={styles.skipButton}
                  onClick={handleSkip}
                  disabled={isDisabled}
                >
                  דלג
                </button>
              )}
              <button
                className={styles.finishButton}
                onClick={onFinish}
                disabled={isDisabled}
              >
                סיום
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
