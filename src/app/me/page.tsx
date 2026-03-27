import ROUTES from "@/constants/routes";
import { requireAuth } from "@/lib/auth";
import { getUserProfile } from "@/lib/data/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/utils/formatDate";
import EditProfileForm from "@/components/forms/EditProfileForm/EditProfileForm";
import { isLotteryActive } from "@/constants/lottery";
import { getLotteryEntriesCount } from "@/lib/lottery";
import LotterySection from "./LotterySection";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "האזור האישי",
  description: "ניהול פרטי החשבון האישי.",
  robots: {
    index: false,
    follow: false,
  },
};

// Must remain dynamic: requires authentication
export const dynamic = "force-dynamic";

export default async function MyProfilePage() {
  const session = await requireAuth(ROUTES.MY_PROFILE);

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect(ROUTES.AUTH_SIGNIN);
  }

  const lotteryActive = isLotteryActive();
  const lotteryEntries = lotteryActive
    ? await getLotteryEntriesCount(session.user.id)
    : 0;

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <h1 className={styles.title}>האזור האישי</h1>
        <p className={styles.subtitle}>ניהול פרטי החשבון שלך.</p>
      </header>

      <section className={styles.profileCard}>
        {/* Avatar */}
        <div className={styles.avatarRow}>
          {profile.image ? (
            <img
              className={styles.avatar}
              src={profile.image}
              alt=""
              width={64}
              height={64}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className={styles.avatarFallback} aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                focusable="false"
                className={styles.avatarIcon}
              >
                <path
                  fill="currentColor"
                  d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.5 0-6.5 2.2-7.6 5.3a1 1 0 0 0 .9 1.3h13.4a1 1 0 0 0 .9-1.3C18.5 16.2 15.5 14 12 14Z"
                />
              </svg>
            </span>
          )}
        </div>

        {/* Email — read only */}
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>אימייל</span>
          <span className={styles.infoValue} dir="ltr">
            {profile.email ?? "—"}
          </span>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <Link href={ROUTES.MY_REVIEWS} className={styles.statLink}>
            <span className={styles.statValue}>{profile.reviewCount}</span>
            <span className={styles.statLabel}>ביקורות</span>
          </Link>
          <Link href={ROUTES.MY_WATCHLIST} className={styles.statLink}>
            <span className={styles.statValue}>{profile.watchlistCount}</span>
            <span className={styles.statLabel}>ברשימת צפייה</span>
          </Link>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {formatDate(profile.createdAt.toISOString())}
            </span>
            <span className={styles.statLabel}>תאריך הצטרפות</span>
          </div>
          {lotteryActive && (
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.statValueGold}`}>
                {lotteryEntries}
              </span>
              <span className={styles.statLabel}>🎟️ כרטיסי הגרלה</span>
            </div>
          )}
        </div>

        {lotteryActive && <LotterySection entries={lotteryEntries} />}
      </section>

      {/* Display name edit */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>שם תצוגה</h2>
        <p className={styles.sectionDescription}>
          כך השם שלך יופיע בביקורות שתכתוב.י. שינוי השם יעדכן גם ביקורות קיימות.
        </p>
        <EditProfileForm currentName={profile.name ?? ""} />
      </section>
    </main>
  );
}
