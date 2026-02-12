export interface Review {
  id: number;
  showId?: number;
  userId?: string | null;
  author: string;
  title?: string | null;
  text: string;
  rating: number;
  date: string | Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Show {
  id: number;
  title: string;
  theatre: string;
  durationMinutes: number;
  summary: string;
  genre: string[];
  reviews: Review[];
}

export interface EnrichedShow extends Show {
  reviewCount: number;
  avgRating: number | null;
  latestReviewDate: Date | null;
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
