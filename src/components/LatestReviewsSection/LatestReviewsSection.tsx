import SectionHeader from "@/components/SectionHeader/SectionHeader";
import ShowCarousel from "@/components/ShowCarousel/ShowCarousel";
import LatestReviewCard from "@/components/LatestReviewCard/LatestReviewCard";
import ROUTES from "@/constants/routes";
import type { LatestReviewItem } from "@/types";
import styles from "./LatestReviewsSection.module.css";

const MIN_REVIEWS = 3;

interface LatestReviewsSectionProps {
  reviews: LatestReviewItem[];
}

export default function LatestReviewsSection({
  reviews,
}: LatestReviewsSectionProps) {
  if (reviews.length < MIN_REVIEWS) return null;

  return (
    <section className={styles.section} aria-label="ביקורות אחרונות">
      <SectionHeader
        kicker="מהקהל"
        title="ביקורות אחרונות"
        linkHref={ROUTES.REVIEWS_NEW}
        linkText="כתבו ביקורת"
      />
      <ShowCarousel label="ביקורות אחרונות">
        {reviews.map((review, index) => (
          <div
            key={review.id}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} מתוך ${reviews.length}`}
          >
            <LatestReviewCard review={review} />
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
