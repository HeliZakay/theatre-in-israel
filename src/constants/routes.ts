// Centralized route constants
export const ROUTES = {
  HOME: "/",
  EVENTS: "/events",
  SHOWS: "/shows",
  REVIEWS_NEW: "/reviews/new",
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNUP: "/auth/signup",
  AUTH_ERROR: "/auth/error",
  MY_PROFILE: "/me",
  MY_REVIEWS: "/me/reviews",
  MY_WATCHLIST: "/me/watchlist",
  CONTACT: "/contact",
} as const;

export type Routes = typeof ROUTES;

/** Build the canonical path for a single show page. */
export function showPath(slug: string): string {
  return `${ROUTES.SHOWS}/${slug}`;
}

/** Build the path for the "write a review" page of a show. */
export function showReviewPath(slug: string): string {
  return `${ROUTES.SHOWS}/${slug}/review`;
}

/** Build the canonical path for an events page with optional filter segments. */
export function eventsPath(filters: string[] = []): string {
  return filters.length > 0
    ? `${ROUTES.EVENTS}/${filters.join("/")}`
    : ROUTES.EVENTS;
}

export default ROUTES;
