// Centralized route constants
export const ROUTES = {
  HOME: "/",
  SHOWS: "/shows",
  REVIEWS_NEW: "/reviews/new",
  API_REVIEWS: "/api/reviews",
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNUP: "/auth/signup",
  MY_REVIEWS: "/me/reviews",
} as const;

export type Routes = typeof ROUTES;

export default ROUTES;
