// Centralized route constants
export const ROUTES = {
  HOME: "/",
  SHOWS: "/shows",
  REVIEWS_NEW: "/reviews/new",
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNUP: "/auth/signup",
  MY_REVIEWS: "/me/reviews",
  MY_WATCHLIST: "/me/watchlist",
  CONTACT: "/contact",
} as const;

export type Routes = typeof ROUTES;

export default ROUTES;
