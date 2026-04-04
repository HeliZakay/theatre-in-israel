"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import MiniStars from "./MiniStars";
import { logEvent } from "@/lib/analytics";
import styles from "./ReviewSummary.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type SubmissionState =
  | { status: "idle" }
  | { status: "submitting"; progress: number; total: number }
  | {
      status: "partial_failure";
      succeeded: { showId: number; rating: number; text: string }[];
      failed: { showId: number; rating: number; text: string; error: string }[];
    };

interface ReviewSummaryProps {
  drafts: { showId: number; rating: number; text: string }[];
  shows: BatchShowItem[];
  isAuthenticated: boolean;
  onEdit: (showId: number) => void;
  onSubmitComplete: (reviews: { showId: number; rating: number; text: string }[]) => void;
  submitToServer: (review: { showId: number; rating: number; text: string }) => Promise<unknown>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ReviewSummary({
  drafts,
  shows,
  isAuthenticated,
  onEdit,
  onSubmitComplete,
  submitToServer,
}: ReviewSummaryProps) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus heading on mount for a11y
  useEffect(() => {
    requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
  }, []);

  const isSubmitting = submissionState.status === "submitting";

  const handleBulkSubmit = useCallback(
    async (reviewsToSubmit: { showId: number; rating: number; text: string }[]) => {
      const total = reviewsToSubmit.length;
      setSubmissionState({ status: "submitting", progress: 0, total });

      logEvent("batch_bulk_submit_start", { count: total });

      const succeeded: { showId: number; rating: number; text: string }[] = [];
      const failed: { showId: number; rating: number; text: string; error: string }[] = [];

      for (let i = 0; i < reviewsToSubmit.length; i++) {
        setSubmissionState({ status: "submitting", progress: i + 1, total });
        try {
          await submitToServer(reviewsToSubmit[i]);
          succeeded.push(reviewsToSubmit[i]);
        } catch (err) {
          failed.push({
            ...reviewsToSubmit[i],
            error: err instanceof Error ? err.message : "שגיאה בשליחה",
          });
        }
      }

      if (failed.length === 0) {
        logEvent("batch_bulk_submit", { count: total, allSucceeded: true });
        onSubmitComplete(succeeded);
      } else {
        logEvent("batch_bulk_submit", { count: total, failedCount: failed.length });
        setSubmissionState({ status: "partial_failure", succeeded, failed });
      }
    },
    [submitToServer, onSubmitComplete],
  );

  const handleSubmitAll = useCallback(() => {
    handleBulkSubmit(drafts);
  }, [drafts, handleBulkSubmit]);

  const handleRetryFailed = useCallback(() => {
    if (submissionState.status !== "partial_failure") return;
    const failedReviews = submissionState.failed.map(({ error: _, ...review }) => review);
    handleBulkSubmit(failedReviews);
  }, [submissionState, handleBulkSubmit]);

  const handleContinueAnyway = useCallback(() => {
    if (submissionState.status !== "partial_failure") return;
    onSubmitComplete(submissionState.succeeded);
  }, [submissionState, onSubmitComplete]);

  // Succeeded show IDs for partial failure display
  const succeededIds =
    submissionState.status === "partial_failure"
      ? new Set(submissionState.succeeded.map((r) => r.showId))
      : new Set<number>();
  const failedMap =
    submissionState.status === "partial_failure"
      ? new Map(submissionState.failed.map((f) => [f.showId, f.error]))
      : new Map<number, string>();

  if (drafts.length === 0) {
    return (
      <div className={styles.summary}>
        <div className={styles.emptyState}>
          <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
            אין ביקורות לשלוח
          </h1>
          <p className={styles.subtitle}>חזרו אחורה וכתבו ביקורת אחת לפחות</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.summary}>
      {/* Header */}
      <div className={styles.headerSection}>
        <h1 ref={headingRef} className={styles.heading} tabIndex={-1}>
          סיכום הביקורות
        </h1>
        <p className={styles.subtitle}>
          כתבתם {drafts.length === 1 ? "ביקורת אחת" : `${drafts.length} ביקורות`}
          {" — "}
          בדקו ושלחו
        </p>
      </div>

      {/* Review cards grid */}
      <div className={styles.reviewGrid} role="list">
        {drafts.map(({ showId, rating, text }, index) => {
          const show = shows.find((s) => s.id === showId);
          if (!show) return null;
          const isSucceeded = succeededIds.has(showId);
          const failError = failedMap.get(showId);

          return (
            <div
              key={showId}
              className={`${styles.reviewCard} ${isSucceeded ? styles.reviewCardSucceeded : ""} ${failError ? styles.reviewCardFailed : ""}`}
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
                  <span className={styles.showTheatre}>{show.theatre}</span>
                  <MiniStars rating={rating} />
                </div>
                {!isSubmitting && !isSucceeded && (
                  <button
                    className={styles.editButton}
                    onClick={() => onEdit(showId)}
                    aria-label={`ערוך ביקורת: ${show.title}`}
                  >
                    עריכה
                  </button>
                )}
                {isSucceeded && (
                  <span className={styles.succeededBadge} aria-label="נשלחה">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </div>
              {text && text.length > 5 && (
                <p className={styles.reviewSnippet}>{text}</p>
              )}
              {failError && (
                <p className={styles.cardError}>{failError}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Submission progress */}
      {submissionState.status === "submitting" && (
        <div className={styles.progressSection}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(submissionState.progress / submissionState.total) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            שולח {submissionState.progress} מתוך {submissionState.total}...
          </span>
        </div>
      )}

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {submissionState.status === "idle" && (
          <button
            className={styles.sendAllButton}
            onClick={handleSubmitAll}
          >
            שלח הכל ({drafts.length})
          </button>
        )}
        {submissionState.status === "submitting" && (
          <button className={styles.sendAllButton} disabled>
            שולח...
          </button>
        )}
        {submissionState.status === "partial_failure" && (
          <div className={styles.failureActions}>
            <button
              className={styles.retryButton}
              onClick={handleRetryFailed}
            >
              נסה שוב ({submissionState.failed.length})
            </button>
            <button
              className={styles.continueButton}
              onClick={handleContinueAnyway}
            >
              המשך בלי הנכשלות
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
