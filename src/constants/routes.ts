// Centralized route constants
export const ROUTES = {
  HOME: "/",
  SHOWS: "/shows",
  REVIEWS_NEW: "/reviews/new",
  API_REVIEWS: "/api/reviews",
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNUP: "/auth/signup",
  MY_REVIEWS: "/me/reviews",
  MY_WATCHLIST: "/me/watchlist",
  API_WATCHLIST: "/api/watchlist",
} as const;

export type Routes = typeof ROUTES;

export default ROUTES;
