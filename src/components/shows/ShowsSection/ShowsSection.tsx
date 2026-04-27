import styles from "./ShowsSection.module.css";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import HomeShowCard from "@/components/shows/HomeShowCard/HomeShowCard";
import type { ShowListItem } from "@/types";

interface ShowsSectionProps {
  kicker?: string;
  title: string;
  shows: ShowListItem[];
  linkHref?: string;
  linkText?: string;
  className?: string;
  sectionGenres?: string[];
}

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
  className,
  sectionGenres,
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
            <HomeShowCard
              show={show}
              sectionGenres={sectionGenres}
              imageSizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw"
            />
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
