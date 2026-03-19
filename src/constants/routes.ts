// Centralized route constants
export const ROUTES = {
  HOME: "/",
  EVENTS: "/events",
  SHOWS: "/shows",
  THEATRES: "/theatres",
  GENRES: "/genres",
  CITIES: "/cities",
  REVIEWS_NEW: "/reviews/new",
  AUTH_SIGNIN: "/auth/signin",
  AUTH_SIGNUP: "/auth/signup",
  AUTH_ERROR: "/auth/error",
  MY_PROFILE: "/me",
  MY_REVIEWS: "/me/reviews",
  MY_WATCHLIST: "/me/watchlist",
  ACTORS: "/actors",
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

/** Build the path for the "all reviews" page of a show. */
export function showReviewsPath(slug: string): string {
  return `${ROUTES.SHOWS}/${slug}/reviews`;
}

/** Build the canonical path for an events page with optional filter segments. */
export function eventsPath(filters: string[] = []): string {
  return filters.length > 0
    ? `${ROUTES.EVENTS}/${filters.join("/")}`
    : ROUTES.EVENTS;
}

/** Build the canonical path for a single theatre page. */
export function theatrePath(slug: string): string {
  return `${ROUTES.THEATRES}/${slug}`;
}

/** Build the canonical path for a single genre page. */
export function genrePath(slug: string): string {
  return `${ROUTES.GENRES}/${slug}`;
}

/** Build the canonical path for a single city page. */
export function cityPath(slug: string): string {
  return `${ROUTES.CITIES}/${slug}`;
}

/** Build the canonical path for a single actor page. */
export function actorPath(slug: string): string {
  return `${ROUTES.ACTORS}/${slug}`;
}

export default ROUTES;
