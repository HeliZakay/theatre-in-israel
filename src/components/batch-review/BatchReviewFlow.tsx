"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShowSelectionGrid from "./ShowSelectionGrid";
import ReviewStep from "./ReviewStep";
import ExitSummary from "./ExitSummary";
import { createReview, createAnonymousReview } from "@/app/reviews/actions";
import { logEvent } from "@/lib/analytics";
import { EXPRESSION_CHIPS } from "@/constants/expressionChips";
import styles from "./BatchReviewFlow.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

type Step = "select" | "review" | "exit";

interface BatchFlowState {
  step: Step;
  prevStep: Step | null;
  selectedShowIds: number[];
  currentIndex: number;
  completedReviews: { showId: number; rating: number; text: string }[];
  alreadyReviewedIds: Set<number>;
  submissionStatus: "idle" | "pending" | "confirmed" | "error";
  errorMessage: string;
}

type BatchFlowAction =
  | { type: "TOGGLE_SHOW"; showId: number }
  | { type: "START_REVIEWS" }
  | { type: "SET_SUBMISSION_STATUS"; status: BatchFlowState["submissionStatus"] }
  | { type: "SET_ERROR"; message: string }
  | { type: "REVIEW_CONFIRMED"; showId: number; rating: number; text: string }
  | { type: "SKIP_SHOW" }
  | { type: "AUTO_ADVANCE" }
  | { type: "FINISH" }
  | { type: "BACK_TO_SELECT" };

function createInitialState(reviewedShowIds: number[]): BatchFlowState {
  return {
    step: "select",
    prevStep: null,
    selectedShowIds: [],
    currentIndex: 0,
    completedReviews: [],
    alreadyReviewedIds: new Set(reviewedShowIds),
    submissionStatus: "idle",
    errorMessage: "",
  };
}

function getTransitionClass(
  prevStep: Step | null,
  step: Step,
): string | null {
  if (!prevStep) return null;
  if (prevStep === "select" && step === "review") return "slideInFromLeft";
  if (prevStep === "review" && step === "select") return "fadeIn";
  if (prevStep === "review" && step === "review") return "fadeSlideIn";
  if (step === "exit") return "fadeIn";
  return null;
}

function withStepTransition(
  state: BatchFlowState,
  next: Partial<BatchFlowState>,
): BatchFlowState {
  const nextStep = next.step ?? state.step;
  return {
    ...state,
    ...next,
    prevStep: nextStep !== state.step ? state.step : state.prevStep,
  };
}

function reducer(
  state: BatchFlowState,
  action: BatchFlowAction,
): BatchFlowState {
  switch (action.type) {
    case "TOGGLE_SHOW": {
      const ids = state.selectedShowIds;
      const exists = ids.includes(action.showId);
      if (!exists && ids.length >= 50) return state;
      return {
        ...state,
        selectedShowIds: exists
          ? ids.filter((id) => id !== action.showId)
          : [...ids, action.showId],
      };
    }
    case "BACK_TO_SELECT":
      return withStepTransition(state, {
        step: "select",
        currentIndex: 0,
        completedReviews: [],
        submissionStatus: "idle",
        errorMessage: "",
      });
    case "START_REVIEWS":
      return withStepTransition(state, {
        step: "review",
        currentIndex: 0,
        completedReviews: [],
        submissionStatus: "idle",
        errorMessage: "",
      });
    case "SET_SUBMISSION_STATUS":
      return {
        ...state,
        submissionStatus: action.status,
        errorMessage: "",
      };
    case "SET_ERROR":
      return {
        ...state,
        submissionStatus: "error",
        errorMessage: action.message,
      };
    case "REVIEW_CONFIRMED":
      return {
        ...state,
        completedReviews: [
          ...state.completedReviews,
          { showId: action.showId, rating: action.rating, text: action.text },
        ],
        submissionStatus: "confirmed",
        errorMessage: "",
      };
    case "SKIP_SHOW": {
      const nextIndex = state.currentIndex + 1;
      const isLast = nextIndex >= state.selectedShowIds.length;
      if (isLast) {
        return withStepTransition(state, {
          currentIndex: nextIndex,
          step: "exit",
          submissionStatus: "idle",
          errorMessage: "",
        });
      }
      // Same step (review→review): force prevStep so transition animation fires
      return {
        ...state,
        currentIndex: nextIndex,
        step: "review",
        prevStep: "review",
        submissionStatus: "idle",
        errorMessage: "",
      };
    }
    case "AUTO_ADVANCE": {
      const nextIndex = state.currentIndex + 1;
      const isLast = nextIndex >= state.selectedShowIds.length;
      if (isLast) {
        return withStepTransition(state, {
          currentIndex: nextIndex,
          step: "exit",
          submissionStatus: "idle",
          errorMessage: "",
        });
      }
      // Same step (review→review): force prevStep so transition animation fires
      return {
        ...state,
        currentIndex: nextIndex,
        step: "review",
        prevStep: "review",
        submissionStatus: "idle",
        errorMessage: "",
      };
    }
    case "FINISH":
      return withStepTransition(state, {
        step: "exit",
        submissionStatus: "idle",
        errorMessage: "",
      });
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface BatchReviewFlowProps {
  shows: BatchShowItem[];
  reviewedShowIds: number[];
  isAuthenticated: boolean;
}

export default function BatchReviewFlow({
  shows,
  reviewedShowIds,
  isAuthenticated,
}: BatchReviewFlowProps) {
  const [state, dispatch] = useReducer(
    reducer,
    reviewedShowIds,
    createInitialState,
  );
  const router = useRouter();
  const selectedSet = new Set(state.selectedShowIds);
  const selectionCount = state.selectedShowIds.length;

  // Aria-live announcements
  const [announcement, setAnnouncement] = useState("");
  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    requestAnimationFrame(() => setAnnouncement(msg));
  }, []);

  // Focus management: move focus after step transitions (including review→review)
  const prevStepRef = useRef(state.step);
  const prevIndexRef = useRef(state.currentIndex);
  useEffect(() => {
    const stepChanged = prevStepRef.current !== state.step;
    const indexChanged = prevIndexRef.current !== state.currentIndex;
    if (!stepChanged && !indexChanged) return;
    const prev = prevStepRef.current;
    prevStepRef.current = state.step;
    prevIndexRef.current = state.currentIndex;

    requestAnimationFrame(() => {
      if (state.step === "review" && (stepChanged || indexChanged)) {
        const star = document.querySelector<HTMLElement>(
          '[role="radiogroup"] [role="radio"][tabindex="0"]',
        );
        star?.focus();
        const show = shows.find(
          (s) => s.id === state.selectedShowIds[state.currentIndex],
        );
        announce(
          `ביקורת ${state.currentIndex + 1} מתוך ${state.selectedShowIds.length}: ${show?.title ?? ""}`,
        );
      } else if (state.step === "exit") {
        announce(`תודה! ביקרתם ${state.completedReviews.length} הצגות!`);
      }
    });

    // Analytics: track step transitions
    if (state.step === "review" && prev === "select") {
      logEvent("batch_start_reviews", {
        showCount: state.selectedShowIds.length,
      });
    } else if (state.step === "exit") {
      logEvent("batch_complete", {
        reviewedCount: state.completedReviews.length,
        selectedCount: state.selectedShowIds.length,
      });
    }
  }, [state.step, state.currentIndex, state.selectedShowIds, state.completedReviews.length, shows, announce]);

  // Announce confirmation via aria-live (without changing step)
  useEffect(() => {
    if (state.submissionStatus === "confirmed") {
      announce("הביקורת שלכם פורסמה!");
    }
  }, [state.submissionStatus, announce]);

  // Auto-advance after review confirmed
  useEffect(() => {
    if (state.submissionStatus !== "confirmed") return;
    const timer = setTimeout(() => {
      dispatch({ type: "AUTO_ADVANCE" });
    }, 1200);
    return () => clearTimeout(timer);
  }, [state.submissionStatus]);

  // Track page entry
  const entryTracked = useRef(false);
  useEffect(() => {
    if (!entryTracked.current) {
      entryTracked.current = true;
      logEvent("batch_page_view", {});
    }
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Server submission helper                                         */
  /* ---------------------------------------------------------------- */

  const submitToServer = useCallback(
    async (review: { showId: number; rating: number; text: string }) => {
      const formData = new FormData();
      formData.set("showId", String(review.showId));
      formData.set("rating", String(review.rating));
      formData.set("text", review.text);
      formData.set("title", "");

      if (!isAuthenticated) {
        formData.set("name", "");
        formData.set("honeypot", "");
      }

      const action = isAuthenticated ? createReview : createAnonymousReview;
      const result = await action(formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Track review quality metrics
      const chipCount = EXPRESSION_CHIPS.filter((c) =>
        review.text.includes(c),
      ).length;
      logEvent("batch_review_quality", {
        showId: review.showId,
        textLength: review.text.length,
        chipCount,
        rating: review.rating,
      });

      return result;
    },
    [isAuthenticated],
  );

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleToggle = useCallback(
    (showId: number) => dispatch({ type: "TOGGLE_SHOW", showId }),
    [],
  );

  const handleNext = () => {
    if (selectionCount > 0) {
      dispatch({ type: "START_REVIEWS" });
    }
  };

  const handleReviewSubmitted = useCallback(
    async (showId: number, rating: number, text: string) => {
      dispatch({ type: "SET_SUBMISSION_STATUS", status: "pending" });

      const review = { showId, rating, text };

      try {
        await submitToServer(review);
        logEvent("batch_review_submit", { showId, rating });
        dispatch({ type: "REVIEW_CONFIRMED", showId, rating, text });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "שגיאה בשליחת הביקורת";
        logEvent("batch_review_error", { message: msg });
        dispatch({ type: "SET_ERROR", message: msg });
      }
    },
    [isAuthenticated, submitToServer],
  );

  const handleBackToSelect = useCallback(() => {
    logEvent("batch_back_to_select", {});
    dispatch({ type: "BACK_TO_SELECT" });
  }, []);

  const handleSkip = useCallback(
    (showId: number, position: number) => {
      logEvent("batch_review_skip", { showId, position });
      dispatch({ type: "SKIP_SHOW" });
    },
    [],
  );

  const handleFinish = () => {
    dispatch({ type: "FINISH" });
  };

  const handleClose = () => {
    const hasUnfinished =
      state.completedReviews.length < state.selectedShowIds.length &&
      state.step !== "select" &&
      state.step !== "exit";

    if (hasUnfinished) {
      const confirmed = window.confirm(
        "יש ביקורות שעוד לא הושלמו. לצאת בכל זאת?",
      );
      if (!confirmed) return;
    }

    router.push("/");
  };

  const transitionStyleMap: Record<string, string> = {
    slideInFromLeft: styles.slideInFromLeft,
    fadeSlideIn: styles.fadeSlideIn,
    fadeIn: styles.fadeIn,
  };
  const transitionName = getTransitionClass(state.prevStep, state.step);
  const transitionClass = transitionName
    ? transitionStyleMap[transitionName] ?? ""
    : "";

  const showFinishLink = state.step === "review";

  return (
    <main className={`${styles.flow} ${state.step === "exit" ? styles.flowExit : ""}`} dir="rtl">
      {/* Screen reader live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        {announcement}
      </div>

      {/* Close button — always visible */}
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="סגור"
      >
        ✕
      </button>

      {/* Finish link — visible during review step */}
      {showFinishLink && (
        <button className={styles.finishLink} onClick={handleFinish}>
          סיום
        </button>
      )}

      {state.step === "select" && (
        <>
          <header className={styles.header}>
            <h1 className={styles.heading}>אילו הצגות ראיתם?</h1>
            <p className={styles.subtitle}>
              בחרו הצגות שראיתם וכתבו ביקורות בזריזות
            </p>
          </header>

          <ShowSelectionGrid
            shows={shows}
            selectedIds={selectedSet}
            reviewedIds={state.alreadyReviewedIds}
            onToggle={handleToggle}
            announceSelection={announce}
          />

          {selectionCount > 0 && (
            <div className={styles.bottomBar}>
              <button
                className={styles.nextButton}
                onClick={handleNext}
                aria-label={`המשך עם ${selectionCount === 1 ? "הצגה אחת" : `${selectionCount} הצגות`} נבחרות`}
              >
                המשך ({selectionCount === 1 ? "הצגה אחת" : `${selectionCount} הצגות`})
              </button>
            </div>
          )}
        </>
      )}

      {state.step === "review" && (() => {
        const currentShowId = state.selectedShowIds[state.currentIndex];
        const currentShow = shows.find((s) => s.id === currentShowId);
        if (!currentShow) return null;
        return (
          <div className={styles.reviewWrapper}>
            <div key={`review-${currentShowId}`} className={transitionClass}>
              <ReviewStep
                key={currentShowId}
                show={currentShow}
                currentIndex={state.currentIndex}
                totalCount={state.selectedShowIds.length}
                submissionStatus={state.submissionStatus}
                errorMessage={state.errorMessage}
                onSubmitted={handleReviewSubmitted}
                onBack={handleBackToSelect}
                onSkip={() =>
                  handleSkip(currentShowId, state.currentIndex + 1)
                }
              />
            </div>
          </div>
        );
      })()}

      {state.step === "exit" && (
        <div className={transitionClass}>
          <ExitSummary
            completedReviews={state.completedReviews}
            shows={shows}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </main>
  );
}
