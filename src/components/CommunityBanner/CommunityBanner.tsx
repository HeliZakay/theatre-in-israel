import CommunityBannerHeadline from "./CommunityBannerHeadline";
import CommunityBannerGrid from "./CommunityBannerGrid";
import type { CommunityBannerShow } from "@/lib/data/homepage";
import styles from "./CommunityBanner.module.css";

interface Props {
  shows: CommunityBannerShow[];
}

export default function CommunityBanner({ shows }: Props) {
  return (
    <section className={styles.banner} aria-label="הצטרפו לקהילה">
      <div className={styles.content}>
        <CommunityBannerHeadline />
      </div>
      <CommunityBannerGrid pool={shows} />
    </section>
  );
}
