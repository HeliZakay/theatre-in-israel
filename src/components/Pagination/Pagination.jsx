import Link from "next/link";
import styles from "./Pagination.module.css";
import { buildShowsQueryString } from "@/utils/showsQuery";
import ROUTES from "@/constants/routes";

export default function Pagination({ filters }) {
  const {
    page = 1,
    totalPages = 1,
    perPage,
    query,
    theatreFilter,
    genreFilters,
    selectedSort,
  } = filters;

  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={`${ROUTES.SHOWS}${buildShowsQueryString({ query, theatre: theatreFilter, genres: genreFilters, sort: selectedSort, page: page - 1 })}`}
          className={styles.prev}
        >
          הקודם
        </Link>
      ) : (
        <span className={styles.disabled}>הקודם</span>
      )}

      {start > 1 ? (
        <Link
          href={`${ROUTES.SHOWS}${buildShowsQueryString({ query, theatre: theatreFilter, genres: genreFilters, sort: selectedSort, page: 1 })}`}
          className={styles.page}
        >
          1
        </Link>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={`${ROUTES.SHOWS}${buildShowsQueryString({ query, theatre: theatreFilter, genres: genreFilters, sort: selectedSort, page: p })}`}
          className={p === page ? styles.active : styles.page}
        >
          {p}
        </Link>
      ))}

      {end < totalPages ? (
        <Link
          href={`${ROUTES.SHOWS}${buildShowsQueryString({ query, theatre: theatreFilter, genres: genreFilters, sort: selectedSort, page: totalPages })}`}
          className={styles.page}
        >
          {totalPages}
        </Link>
      ) : null}

      {page < totalPages ? (
        <Link
          href={`${ROUTES.SHOWS}${buildShowsQueryString({ query, theatre: theatreFilter, genres: genreFilters, sort: selectedSort, page: page + 1 })}`}
          className={styles.next}
        >
          הבא
        </Link>
      ) : (
        <span className={styles.disabled}>הבא</span>
      )}
    </nav>
  );
}
