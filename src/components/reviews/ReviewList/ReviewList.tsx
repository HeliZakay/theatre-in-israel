"use client";

import { useState } from "react";
import ReviewCard from "@/components/reviews/ReviewCard/ReviewCard";
import styles from "./ReviewList.module.css";
import type { Review } from "@/types";

const PAGE_SIZE = 10;

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = reviews.slice(0, visible);
  const remaining = reviews.length - visible;

  return (
    <>
      {shown.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {remaining > 0 && (
        <button
          className={styles.showMore}
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
        >
          הצגת עוד ביקורות ({Math.min(remaining, PAGE_SIZE)} מתוך {remaining})
        </button>
      )}
    </>
  );
}
