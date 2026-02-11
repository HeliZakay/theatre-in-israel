// Centralized route constants
export const ROUTES = {
  HOME: "/",
  SHOWS: "/shows",
  REVIEWS_NEW: "/reviews/new",
  API_REVIEWS: "/api/reviews",
} as const;

export type Routes = typeof ROUTES;

export default ROUTES;
