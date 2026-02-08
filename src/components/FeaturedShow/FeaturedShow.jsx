import * as Separator from "@radix-ui/react-separator";
import Image from "next/image";
import styles from "./FeaturedShow.module.css";

export default function FeaturedShow({
  title,
  imageSrc,
  imageAlt,
  tags = [],
  quote,
  quoteAuthor,
}) {
  return (
    <article className={styles.card} aria-label="כרטיס הצגה מומלצת">
      <div className={styles.media}>
        <div className={styles.mediaRatio}>
          <Image
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
