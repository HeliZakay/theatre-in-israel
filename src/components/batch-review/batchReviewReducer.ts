export type Step = "select" | "review" | "summary" | "exit";

export interface BatchFlowState {
  step: Step;
  prevStep: Step | null;
  selectedShowIds: number[];
  currentIndex: number;
  completedReviews: { showId: number; rating: number; text: string }[];
  alreadyReviewedIds: Set<number>;
  editingFromSummary: boolean;
  reviewerName: string;
}

export type BatchFlowAction =
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

export function createInitialState(reviewedShowIds: number[]): BatchFlowState {
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

export function getTransitionClass(
  prevStep: Step | null,
  step: Step,
): string | null {
  if (!prevStep) return null;
  if (prevStep === "select" && step === "review") return "slideInFromLeft";
  if (prevStep === "review" && step === "select") return "fadeIn";
  if (prevStep === "review" && step === "review") return null;
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

export function reducer(
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
