import * as Separator from "@radix-ui/react-separator";
import Link from "next/link";
import styles from "./FeaturedShow.module.css";
import FallbackImage from "@/components/FallbackImage/FallbackImage";

interface FeaturedShowProps {
  title: string;
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
          <FallbackImage
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 900px) 100vw, 45vw"
            className={styles.mediaImage}
            priority
          />
          <div className={styles.mediaShade} aria-hidden />
          <div className={styles.mediaOverlay}>
            <h3 className={styles.showTitle}>{title}</h3>
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
        <h3 className={styles.mobileTitle}>{title}</h3>
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
            {quote}
            {quoteAuthor && (
              <span className={styles.quoteAuthor}>{quoteAuthor}</span>
            )}
          </blockquote>
        )}
      </div>
    </article>
  );
}
