"use client";

import { useState } from "react";
import styles from "./ReviewCard.module.css";
import { formatDate } from "@/utils/formatDate";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = review.text.trim().length > 320;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span>{review.author}</span>
          {review.date ? (
            <>
              <span className={styles.dot}>•</span>
              <span>{formatDate(review.date)}</span>
            </>
          ) : null}
        </div>
        <span className={styles.rating}>★{review.rating}</span>
      </div>
      <p
        className={`${styles.text} ${
          shouldTruncate && !isExpanded ? styles.textTruncated : ""
        }`}
      >
        {review.text}
      </p>
      {shouldTruncate ? (
        <button
          type="button"
          className={styles.readMoreBtn}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? "קרא פחות" : "קרא עוד"}
        </button>
      ) : null}
    </article>
  );
}
