import ExploreBannerHeadline from "./ExploreBannerHeadline";
import ExploreBannerGrid from "./ExploreBannerGrid";
import type { ExploreBannerShow } from "@/lib/data/homepage";
import styles from "./ExploreBanner.module.css";

interface Props {
  shows: ExploreBannerShow[];
}

export default function ExploreBanner({ shows }: Props) {
  if (shows.length < 4) return null;

  const initial = shows.slice(0, 4);
  const pool = shows;

  return (
    <section className={styles.banner} aria-label="גלו הצגות">
      <div className={styles.content}>
        <ExploreBannerHeadline />
      </div>
      <ExploreBannerGrid pool={pool} initial={initial} />
    </section>
  );
}
