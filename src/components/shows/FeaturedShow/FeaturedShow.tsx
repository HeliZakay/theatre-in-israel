import * as Separator from "@radix-ui/react-separator";
import Link from "next/link";
import styles from "./FeaturedShow.module.css";
import Image from "next/image";
import { getShowImageAlt } from "@/lib/seo";

interface FeaturedShowProps {
  title: string;
  theatre?: string;
  imageSrc: string;
  imageAlt?: string;
  tags?: string[];
  quote?: string | null;
  quoteAuthor?: string | null;
  avgRating?: number | null;
  reviewCount?: number;
  href?: string;
}

export default function FeaturedShow({
  title,
  theatre,
  imageSrc,
  imageAlt,
  tags = [],
  quote,
  quoteAuthor,
  avgRating,
  reviewCount,
  href,
}: FeaturedShowProps) {
  const hasRating = typeof avgRating === "number" && !Number.isNaN(avgRating);
  const formattedRating = hasRating ? avgRating.toFixed(1) : null;
  return (
    <article className={styles.card} aria-label="כרטיס הצגה מומלצת">
      {href && (
        <Link
          href={href}
          className={styles.cardLinkOverlay}
          aria-label={`לעמוד ההצגה ${title}`}
        />
      )}
      <div className={styles.media}>
        <div className={styles.mediaRatio}>
          <Image
            src={imageSrc}
            alt={imageAlt ?? getShowImageAlt(title)}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            className={styles.mediaImage}
            priority
            fetchPriority="high"
          />
          <div className={styles.mediaShade} aria-hidden />
          <span className={styles.badge}>הצגת השבוע</span>
          <div className={styles.mediaOverlay}>
            <h2 className={styles.showTitle}>{title}</h2>
            {theatre && <p className={styles.theatre}>{theatre}</p>}
            <div className={styles.tagRow}>
              {tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <Separator.Root className={styles.separator} />
        <h2 className={styles.mobileTitle}>{title}</h2>
        {theatre && <p className={styles.mobileTheatre}>{theatre}</p>}
        <div className={styles.mobileTags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        {hasRating && (
          <div className={styles.ratingRow}>
            <span className={styles.ratingValue}>{formattedRating}</span>
            <span className={styles.stars}>★</span>
            <span className={styles.reviewCount}>{reviewCount} ביקורות</span>
          </div>
        )}
        {quote && (
          <blockquote className={styles.quote}>
            <p
              className={
                quote.trim().length > 200
                  ? `${styles.quoteText} ${styles.quoteTextTruncated}`
                  : styles.quoteText
              }
            >
              {quote}
            </p>
            {quoteAuthor && (
              <span className={styles.quoteAuthor}>{quoteAuthor}</span>
            )}
            {quote.trim().length > 200 && (
              <span className={styles.readMore}>קרא עוד</span>
            )}
          </blockquote>
        )}
      </div>
    </article>
  );
}
