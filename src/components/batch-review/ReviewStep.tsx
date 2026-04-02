"use client";

import { useState, useCallback, useRef } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/constants/reviewValidation";
import StarRating from "./StarRating";
import ExpressionChips from "./ExpressionChips";
import styles from "./ReviewStep.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ReviewStepProps {
  show: BatchShowItem;
  currentIndex: number;
  totalCount: number;
  submissionStatus: "idle" | "pending" | "confirmed" | "error";
  errorMessage: string;
  defaultName: string | null;
  onSubmitted: (showId: number, rating: number, text: string, name?: string) => void;
  onBack?: () => void;
  onSkip: () => void;
}

export default function ReviewStep({
  show,
  currentIndex,
  totalCount,
  submissionStatus,
  errorMessage: externalError,
  defaultName,
  onSubmitted,
  onBack,
  onSkip,
}: ReviewStepProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState(defaultName ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const progress = ((currentIndex + 1) / totalCount) * 100;
  const isPending = submissionStatus === "pending";
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

  const handleSubmit = () => {
    if (!rating) return;
    onSubmitted(show.id, rating, text, defaultName !== null ? name.trim() : undefined);
  };

  const handleSkip = () => {
    setRating(null);
    setText("");
    onSkip();
  };

  return (
    <div className={styles.reviewStep}>
      {/* Progress */}
      <div className={styles.progressSection}>
        {onBack && (
          <button
            className={styles.backButton}
            onClick={onBack}
            aria-label="חזרה לבחירת הצגות"
            disabled={isPending}
          >
            &#8592;
          </button>
        )}
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
        <StarRating value={rating} onChange={setRating} disabled={isPending} />
      </div>

      {/* Expression chips */}
      <ExpressionChips
        text={text}
        onTextChange={handleChipTextChange}
        rating={rating}
        disabled={isPending}
      />

      {/* Effort hint */}
      <p className={styles.effortHint}>
        גם תגיות בלבד או משפט קצר זה מעולה
      </p>

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
          disabled={isPending}
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

      {/* Optional display name */}
      {defaultName !== null && (
        <div className={styles.nameSection}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="שם תצוגה (אופציונלי)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            disabled={isPending}
            aria-label="שם תצוגה"
          />
        </div>
      )}

      {/* Error */}
      {externalError && (
        <p className={styles.error} role="alert">
          {externalError}
        </p>
      )}

      {/* Sticky bottom bar */}
      <div className={styles.bottomBar}>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!rating || text.length < REVIEW_TEXT_MIN || isPending}
        >
          {isPending ? "שולח..." : "שלח ביקורת"}
        </button>
        <button
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={isPending}
        >
          דלג
        </button>
        <span className={styles.anonNote}>בלי שם תצוגה, הביקורת תופיע כאנונימית</span>
      </div>
    </div>
  );
}
