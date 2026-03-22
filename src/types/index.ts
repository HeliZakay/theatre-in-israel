/** Review as returned from DB / API — all fields present */
export interface Review {
  id: number;
  showId: number;
  userId: string | null;
  author: string;
  title: string | null;
  text: string;
  rating: number;
  date: string; // standardized to ISO string
  createdAt: Date;
  updatedAt: Date;
}

/** Shape used when creating a review */
export interface ReviewInput {
  author: string;
  title?: string | null;
  text: string;
  rating: number;
  date: string;
  userId?: string;
  ip?: string;
}

export interface ShowEvent {
  id: number;
  date: string;
  hour: string;
  venue: { name: string; city: string; address: string | null; regions: string[] };
}

export interface ShowActor {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export interface Show {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  durationMinutes: number;
  summary: string;
  description: string | null;
  cast: string | null;
  webReviewSummary: string | null;
  genre: string[];
  actors: ShowActor[];
  reviews: Review[];
  events: ShowEvent[];
}

export interface EnrichedShow extends Show {
  reviewCount: number;
  avgRating: number | null;
  latestReviewDate: Date | null;
}

/** Lightweight show type for list/card views — carries pre-computed stats instead of full reviews */
export interface ShowListItem {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  durationMinutes: number;
  summary: string;
  description: string | null;
  genre: string[];
  reviewCount: number;
  avgRating: number | null;
}

export interface Suggestions {
  shows: string[];
  theatres: string[];
  genres: string[];
}

export interface ShowFilters {
  theatre: string;
  query: string;
  genres: string[];
  sort: string;
  page: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface WatchlistItem {
  userId: string;
  showId: number;
  createdAt: Date;
  show: {
    id: number;
    slug: string;
    title: string;
    theatre: string;
  };
}

export interface Venue {
  id: number;
  name: string;
  city: string;
  address: string | null;
  regions: string[];
}

export interface Event {
  id: number;
  showId: number;
  venueId: number;
  date: string;
  hour: string;
}

export interface EnrichedEvent extends Event {
  show: ShowListItem;
  venue: Venue;
}

/** Lightweight review type for the "latest reviews" homepage section */
export interface LatestReviewItem {
  id: number;
  author: string;
  title: string | null;
  text: string;
  rating: number;
  createdAt: Date;
  showId: number;
  showSlug: string;
  showTitle: string;
  showTheatre: string;
}
