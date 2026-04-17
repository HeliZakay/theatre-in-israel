import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import LatestReviewCard from "@/components/reviews/LatestReviewCard/LatestReviewCard";
import ROUTES from "@/constants/routes";
import { formatReviewMilestone } from "@/utils/formatReviewCount";
import type { LatestReviewItem } from "@/types";
import styles from "./LatestReviewsSection.module.css";

const MIN_REVIEWS = 3;

interface LatestReviewsSectionProps {
  reviews: LatestReviewItem[];
  totalReviewCount?: number;
}

export default function LatestReviewsSection({
  reviews,
  totalReviewCount = 0,
}: LatestReviewsSectionProps) {
  if (reviews.length < MIN_REVIEWS) return null;

  const kicker =
    totalReviewCount >= 100
      ? `${formatReviewMilestone(totalReviewCount)} ביקורות מהקהל`
      : "מהקהל";

  return (
    <section className={styles.section} aria-label="ביקורות אחרונות">
      <SectionHeader
        kicker={kicker}
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
