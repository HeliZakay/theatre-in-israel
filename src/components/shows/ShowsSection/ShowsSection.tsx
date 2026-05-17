import styles from "./ShowsSection.module.css";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import type { ShowListItem } from "@/types";

interface ShowsSectionProps {
  kicker?: string;
  title: string;
  shows: ShowListItem[];
  linkHref?: string;
  linkText?: string;
  className?: string;
}

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
  className,
}: ShowsSectionProps) {
  return (
    <section className={[styles.section, className].filter(Boolean).join(" ")}>
      <SectionHeader
        kicker={kicker}
        title={title}
        linkHref={linkHref}
        linkText={linkText}
      />
      <ShowCarousel label={title}>
        {shows.map((show, index) => (
          <div
            key={show.id}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} מתוך ${shows.length}`}
          >
            <ShowCard show={show} />
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
