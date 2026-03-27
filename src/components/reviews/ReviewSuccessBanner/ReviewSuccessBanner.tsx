"use client";

import { useEffect, useRef } from "react";
import styles from "./ReviewSuccessBanner.module.css";
import Card from "@/components/ui/Card/Card";
import ShareButtons from "@/components/ui/ShareButtons/ShareButtons";

interface ReviewSuccessBannerProps {
  showSlug: string;
  showTitle: string;
  reviewCount: number | null;
  review: {
    rating: number;
    title: string | null;
    text: string;
  };
  /** When true (default), cleans ?review=success from the URL on mount. */
  cleanUrl?: boolean;
  /** HTML id for the wrapper element (default: "review-success"). */
  id?: string;
}

export default function ReviewSuccessBanner({
  showSlug,
  showTitle,
  reviewCount,
  review,
  cleanUrl = true,
  id = "review-success",
}: ReviewSuccessBannerProps) {
  const cleanedRef = useRef(false);

  useEffect(() => {
    if (!cleanUrl) return;
    if (cleanedRef.current) return;
    cleanedRef.current = true;
    // Clean the URL so the banner doesn't reappear on refresh/bookmark.
    // Use history.replaceState instead of router.replace to avoid triggering
    // a Next.js server re-render that would remove the banner from the page.
    window.history.replaceState(null, "", `/shows/${showSlug}`);
  }, [cleanUrl, showSlug]);

  const shareUrl = `/shows/${showSlug}`;
  const shareText = `כתבתי ביקורת על ${showTitle} באתר תיאטרון בישראל \uD83C\uDFAD`;

  return (
    <Card className={styles.card} id={id}>
      <div className={styles.successBanner} role="status">
        <div>
          <p className={styles.successTitle}>הביקורת שלך פורסמה! 🎉</p>
          {reviewCount !== null && (
            <p className={styles.successSubtitle}>
              {reviewCount === 1
                ? "🏆 הביקורת הראשונה על ההצגה הזו!"
                : `הביקורת ה-${reviewCount} על ההצגה הזו`}
            </p>
          )}
        </div>
      </div>

      <div className={styles.reviewPreview}>
        <div
          className={styles.previewStars}
          aria-label={`דירוג ${review.rating} מתוך 5`}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={
                star <= review.rating ? styles.starFilled : styles.starEmpty
              }
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        {review.title && (
          <p className={styles.previewTitle}>״{review.title}״</p>
        )}
        <p className={styles.previewText}>{review.text}</p>
      </div>

      <div className={styles.shareSection}>
        <p className={styles.shareHeading}>שתפ.י את הביקורת שלך</p>
        <ShareButtons url={shareUrl} text={shareText} />
      </div>
    </Card>
  );
}
