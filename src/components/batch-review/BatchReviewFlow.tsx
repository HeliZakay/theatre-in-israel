"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ShowSelectionGrid from "./ShowSelectionGrid";
import ReviewStep from "./ReviewStep";
import ReviewSummary from "./ReviewSummary";
import ExitSummary from "./ExitSummary";
import { createReview, createAnonymousReview } from "@/app/reviews/actions";
import { logEvent } from "@/lib/analytics";
import { EXPRESSION_CHIPS } from "@/constants/expressionChips";
import { REVIEW_TEXT_MIN } from "@/constants/reviewValidation";
import styles from "./BatchReviewFlow.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

/* ------------------------------------------------------------------ */
/*  State                                                              */
/* ------------------------------------------------------------------ */

type Step = "select" | "review" | "summary" | "exit";

interface BatchFlowState {
  step: Step;
  prevStep: Step | null;
  selectedShowIds: number[];
  currentIndex: number;
  completedReviews: { showId: number; rating: number; text: string }[];
  alreadyReviewedIds: Set<number>;
  editingFromSummary: boolean;
  reviewerName: string;
}

type BatchFlowAction =
  | { type: "TOGGLE_SHOW"; showId: number }
  | { type: "START_REVIEWS" }
  | { type: "NEXT_SHOW" }
  | { type: "PREV_SHOW" }
  | { type: "JUMP_TO"; index: number }
  | { type: "GO_TO_SUMMARY"; drafts: { showId: number; rating: number; text: string }[] }
  | { type: "EDIT_FROM_SUMMARY"; index: number }
  | { type: "RETURN_TO_SUMMARY"; drafts: { showId: number; rating: number; text: string }[] }
  | { type: "BULK_SUBMIT_COMPLETE"; reviews: { showId: number; rating: number; text: string }[]; reviewerName: string }
  | { type: "BACK_TO_SELECT" }
  | { type: "BACK_TO_REVIEW" }
  | { type: "RESUME_REVIEWS" }
  | { type: "RESTORE_STATE"; selectedShowIds: number[]; completedReviews: { showId: number; rating: number; text: string }[] };

function createInitialState(reviewedShowIds: number[]): BatchFlowState {
  return {
    step: "select",
    prevStep: null,
    selectedShowIds: [],
    currentIndex: 0,
    completedReviews: [],
    alreadyReviewedIds: new Set(reviewedShowIds),
    editingFromSummary: false,
    reviewerName: "",
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
  if (prevStep === "review" && step === "summary") return "fadeIn";
  if (prevStep === "summary" && step === "review") return "slideInFromLeft";
  if (prevStep === "summary" && step === "exit") return "fadeIn";
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
        editingFromSummary: false,
      });
    case "BACK_TO_REVIEW":
      return withStepTransition(state, {
        step: "review",
        currentIndex: state.selectedShowIds.length - 1,
        editingFromSummary: false,
      });
    case "RESUME_REVIEWS":
      return withStepTransition(state, {
        step: "review",
        currentIndex: Math.min(state.currentIndex, state.selectedShowIds.length - 1),
        editingFromSummary: false,
      });
    case "START_REVIEWS":
      return withStepTransition(state, {
        step: "review",
        currentIndex: 0,
        completedReviews: [],
        editingFromSummary: false,
      });
    case "NEXT_SHOW": {
      if (state.currentIndex >= state.selectedShowIds.length - 1) return state;
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        step: "review",
        prevStep: "review",
      };
    }
    case "PREV_SHOW": {
      if (state.currentIndex <= 0) return state;
      return {
        ...state,
        currentIndex: state.currentIndex - 1,
        step: "review",
        prevStep: "review",
      };
    }
    case "JUMP_TO":
      return {
        ...state,
        currentIndex: action.index,
        step: "review",
        prevStep: "review",
      };
    case "GO_TO_SUMMARY":
      return withStepTransition(state, {
        step: "summary",
        completedReviews: action.drafts,
        editingFromSummary: false,
      });
    case "EDIT_FROM_SUMMARY":
      return withStepTransition(state, {
        step: "review",
        currentIndex: action.index,
        editingFromSummary: true,
      });
    case "RETURN_TO_SUMMARY":
      return withStepTransition(state, {
        step: "summary",
        completedReviews: action.drafts,
        editingFromSummary: false,
      });
    case "BULK_SUBMIT_COMPLETE":
      return withStepTransition(state, {
        step: "exit",
        completedReviews: action.reviews,
        editingFromSummary: false,
        reviewerName: action.reviewerName,
      });
    case "RESTORE_STATE":
      return withStepTransition(state, {
        step: "summary",
        selectedShowIds: action.selectedShowIds,
        completedReviews: action.completedReviews,
        editingFromSummary: false,
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

const DRAFT_STORAGE_KEY = "batch-review-drafts";
const DRAFT_TTL_MS = 60 * 60 * 1000; // 1 hour

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
  const { status: sessionStatus } = useSession();
  const effectiveAuth = isAuthenticated || sessionStatus === "authenticated";

  // Draft state persisted across show navigation (ref to avoid re-renders on every keystroke)
  const draftsRef = useRef<Record<number, { rating: number | null; text: string }>>({});

  // Save drafts to localStorage (for Google OAuth redirect survival)
  const saveDraftsToStorage = useCallback(() => {
    try {
      const data = {
        drafts: draftsRef.current,
        selectedShowIds: state.selectedShowIds,
        completedReviews: state.completedReviews,
        timestamp: Date.now(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage full or unavailable */ }
  }, [state.selectedShowIds, state.completedReviews]);

  // Restore drafts from localStorage on mount (after Google OAuth redirect)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > DRAFT_TTL_MS) return;
      if (!Array.isArray(data.selectedShowIds) || !Array.isArray(data.completedReviews)) return;
      if (data.drafts) draftsRef.current = data.drafts;
      dispatch({
        type: "RESTORE_STATE",
        selectedShowIds: data.selectedShowIds,
        completedReviews: data.completedReviews,
      });
    } catch { /* corrupted data, ignore */ }
  }, []);

  const handleDraftChange = useCallback(
    (showId: number, draft: { rating: number | null; text: string }) => {
      draftsRef.current[showId] = draft;
    },
    [],
  );
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
      } else if (state.step === "summary") {
        announce(`סיכום ${state.completedReviews.length} ביקורות`);
      } else if (state.step === "exit") {
        announce(`תודה! ביקרתם ${state.completedReviews.length} הצגות!`);
      }
    });

    // Analytics: track step transitions
    if (state.step === "review" && prev === "select") {
      logEvent("batch_start_reviews", {
        showCount: state.selectedShowIds.length,
      });
    } else if (state.step === "summary" && prev === "review") {
      logEvent("batch_summary_view", {
        draftCount: state.completedReviews.length,
        selectedCount: state.selectedShowIds.length,
      });
    } else if (state.step === "exit") {
      logEvent("batch_complete", {
        reviewedCount: state.completedReviews.length,
        selectedCount: state.selectedShowIds.length,
      });
    }
  }, [state.step, state.currentIndex, state.selectedShowIds, state.completedReviews.length, shows, announce]);

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
    async (review: { showId: number; rating: number; text: string; name?: string }) => {
      const formData = new FormData();
      formData.set("showId", String(review.showId));
      formData.set("rating", String(review.rating));
      formData.set("text", review.text);
      formData.set("title", "");

      if (!effectiveAuth) {
        formData.set("name", review.name || "");
        formData.set("honeypot", "");
      }

      const action = effectiveAuth ? createReview : createAnonymousReview;
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
    [effectiveAuth],
  );

  /* ---------------------------------------------------------------- */
  /*  Draft collection helper                                          */
  /* ---------------------------------------------------------------- */

  const collectValidDrafts = useCallback(() => {
    return state.selectedShowIds
      .map((id) => {
        const draft = draftsRef.current[id];
        if (draft && draft.rating !== null && draft.text.length >= REVIEW_TEXT_MIN) {
          return { showId: id, rating: draft.rating, text: draft.text };
        }
        return null;
      })
      .filter((d): d is { showId: number; rating: number; text: string } => d !== null);
  }, [state.selectedShowIds]);

  /* ---------------------------------------------------------------- */
  /*  Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleToggle = useCallback(
    (showId: number) => dispatch({ type: "TOGGLE_SHOW", showId }),
    [],
  );

  const handleNext = () => {
    if (selectionCount > 0) {
      if (state.prevStep === "review") {
        // Returning from edit selection — preserve drafts
        dispatch({ type: "RESUME_REVIEWS" });
      } else {
        // First time starting reviews — clear drafts
        draftsRef.current = {};
        dispatch({ type: "START_REVIEWS" });
      }
    }
  };

  const handleNextShow = useCallback(() => {
    if (state.editingFromSummary) {
      dispatch({ type: "RETURN_TO_SUMMARY", drafts: collectValidDrafts() });
      return;
    }
    const isLast = state.currentIndex === state.selectedShowIds.length - 1;
    if (isLast) {
      dispatch({ type: "GO_TO_SUMMARY", drafts: collectValidDrafts() });
    } else {
      dispatch({ type: "NEXT_SHOW" });
    }
  }, [state.currentIndex, state.selectedShowIds.length, state.editingFromSummary, collectValidDrafts]);

  const handlePrevShow = useCallback(() => {
    dispatch({ type: "PREV_SHOW" });
  }, []);

  const handleJumpTo = useCallback(
    (index: number) => {
      if (index === state.currentIndex) return;
      logEvent("batch_jump_to", { from: state.currentIndex, to: index });
      dispatch({ type: "JUMP_TO", index });
    },
    [state.currentIndex],
  );

  const handleEditSelection = useCallback(() => {
    logEvent("batch_edit_selection", { fromIndex: state.currentIndex, showCount: state.selectedShowIds.length });
    dispatch({ type: "BACK_TO_SELECT" });
  }, [state.currentIndex, state.selectedShowIds.length]);

  const handleEditFromSummary = useCallback(
    (showId: number) => {
      const index = state.selectedShowIds.indexOf(showId);
      if (index !== -1) {
        dispatch({ type: "EDIT_FROM_SUMMARY", index });
      }
    },
    [state.selectedShowIds],
  );

  const handleBackFromSummary = useCallback(() => {
    dispatch({ type: "BACK_TO_REVIEW" });
  }, []);

  const handleBulkSubmitComplete = useCallback(
    (reviews: { showId: number; rating: number; text: string }[], reviewerName: string) => {
      draftsRef.current = {};
      dispatch({ type: "BULK_SUBMIT_COMPLETE", reviews, reviewerName });
    },
    [],
  );

  const handleClose = () => {
    const hasDrafts =
      state.step !== "select" &&
      state.step !== "exit" &&
      Object.values(draftsRef.current).some((d) => d.rating !== null);

    if (hasDrafts) {
      const confirmed = window.confirm(
        "יש ביקורות שעוד לא נשלחו. לצאת בכל זאת?",
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

  // Compute draftedShowIds for ShowNavStrip (shows with rating set)
  const draftedShowIds = new Set(
    state.selectedShowIds.filter((id) => {
      const draft = draftsRef.current[id];
      return draft && draft.rating !== null && draft.text.length >= REVIEW_TEXT_MIN;
    }),
  );

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
            <div className={transitionClass}>
              <ReviewStep
                show={currentShow}
                currentIndex={state.currentIndex}
                onNext={handleNextShow}
                onPrev={handlePrevShow}
                isFirst={state.currentIndex === 0}
                isLast={state.currentIndex === state.selectedShowIds.length - 1}
                editingFromSummary={state.editingFromSummary}
                shows={shows}
                selectedShowIds={state.selectedShowIds}
                onJumpTo={handleJumpTo}
                draftedShowIds={draftedShowIds}
                initialDraft={draftsRef.current[currentShowId]}
                onDraftChange={handleDraftChange}
                onEditSelection={handleEditSelection}
              />
            </div>
          </div>
        );
      })()}

      {state.step === "summary" && (
        <div className={transitionClass} style={{ width: "100%" }}>
          <ReviewSummary
            drafts={state.completedReviews}
            shows={shows}
            isAuthenticated={effectiveAuth}
            onEdit={handleEditFromSummary}
            onBack={handleBackFromSummary}
            onSubmitComplete={handleBulkSubmitComplete}
            submitToServer={submitToServer}
            onBeforeGoogleRedirect={saveDraftsToStorage}
          />
        </div>
      )}

      {state.step === "exit" && (
        <div className={transitionClass} style={{ width: "100%" }}>
          <ExitSummary
            completedReviews={state.completedReviews}
            shows={shows}
            reviewerName={state.reviewerName}
          />
        </div>
      )}
    </main>
  );
}
