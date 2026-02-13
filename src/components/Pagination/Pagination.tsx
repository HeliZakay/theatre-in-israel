import Link from "next/link";
import styles from "./Pagination.module.css";
import { buildShowsQueryString } from "@/utils/showsQuery";
import ROUTES from "@/constants/routes";
import type { ShowFilters } from "@/types";

interface PaginationProps {
  filters: ShowFilters;
}

export default function Pagination({ filters }: PaginationProps) {
  const { page = 1, totalPages = 1 } = filters;

  if (totalPages <= 1) return null;

  const buildPageHref = (p: number) =>
    `${ROUTES.SHOWS}${buildShowsQueryString({ ...filters, page: p })}`;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className={styles.pagination} aria-label="ניווט עמודים">
      {page > 1 ? (
        <Link href={buildPageHref(page - 1)} className={styles.prev}>
          הקודם
        </Link>
      ) : (
        <span className={styles.disabled}>הקודם</span>
      )}

      {start > 1 ? (
        <Link href={buildPageHref(1)} className={styles.page}>
          1
        </Link>
      ) : null}

      {start > 2 ? (
        <span className={styles.ellipsis} aria-hidden="true">
          …
        </span>
      ) : null}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildPageHref(p)}
          className={p === page ? styles.active : styles.page}
        >
          {p}
        </Link>
      ))}

      {end < totalPages - 1 ? (
        <span className={styles.ellipsis} aria-hidden="true">
          …
        </span>
      ) : null}

      {end < totalPages ? (
        <Link href={buildPageHref(totalPages)} className={styles.page}>
          {totalPages}
        </Link>
      ) : null}

      {page < totalPages ? (
        <Link href={buildPageHref(page + 1)} className={styles.next}>
          הבא
        </Link>
      ) : (
        <span className={styles.disabled}>הבא</span>
      )}
    </nav>
  );
}
