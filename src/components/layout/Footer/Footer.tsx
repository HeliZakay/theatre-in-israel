"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";
import ROUTES from "@/constants/routes";
import { titleFont } from "@/lib/fonts";
import { formatReviewMilestone } from "@/utils/formatReviewCount";
import { ExternalLinkIcon, ChevronUpIcon } from "./FooterIcons";

interface FooterProps {
  totalReviewCount?: number;
}

function scrollToTop() {
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
  window.scrollTo({ top: 0, behavior });
}

export default function Footer({ totalReviewCount = 0 }: FooterProps) {
  const pathname = usePathname();
  if (pathname.startsWith("/reviews/batch")) return null;

  return (
    <footer
      className={`${styles.footer} ${titleFont.variable}`}
      aria-label="כותרת תחתונה"
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink} aria-label="דף הבית">
            <Image
              src="/logo-img.png"
              alt=""
              className={styles.brandLogo}
              width={50}
              height={35}
            />
            <p className={styles.brandTitle}>תיאטרון בישראל</p>
          </Link>
          <p className={styles.tagline}>
            ביקורות אמיתיות, המלצות חכמות, וערבים טובים יותר.
          </p>
          <div className={styles.metaRow}>
            {totalReviewCount >= 100 ? (
              <>
                <span>
                  {formatReviewMilestone(totalReviewCount)} ביקורות צופים
                </span>
                <span className={styles.dot}>•</span>
              </>
            ) : null}
            <span>הצגות חדשות בכל שבוע</span>
            <span className={styles.dot}>•</span>
            <span>קהילה אוהבת במה</span>
          </div>
        </div>

        <div className={styles.columns}>
          <nav aria-labelledby="footer-nav-discover">
            <h3 id="footer-nav-discover" className={styles.columnTitle}>
              גלו
            </h3>
            <ul className={styles.linkList}>
              <li>
                <Link href={ROUTES.EVENTS}>לוח הופעות</Link>
              </li>
              <li>
                <Link href={ROUTES.SHOWS}>קטלוג הצגות</Link>
              </li>
              <li>
                <Link href={ROUTES.THEATRES}>תיאטראות</Link>
              </li>
              <li>
                <Link href={ROUTES.GENRES}>ז׳אנרים</Link>
              </li>
              <li>
                <Link href={ROUTES.CITIES}>ערים</Link>
              </li>
              <li>
                <Link href={ROUTES.ACTORS}>שחקנים</Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-nav-participate">
            <h3 id="footer-nav-participate" className={styles.columnTitle}>
              השתתפו
            </h3>
            <ul className={styles.linkList}>
              <li>
                <Link href={ROUTES.REVIEWS_NEW}>כתב.י ביקורת</Link>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/groups/965299379184440"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="קבוצת פייסבוק (נפתח בחלון חדש)"
                >
                  הצטרפו לקהילה
                  <ExternalLinkIcon />
                </a>
              </li>
              <li>
                <Link href={ROUTES.CONTACT}>צר.י קשר</Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-nav-info">
            <h3 id="footer-nav-info" className={styles.columnTitle}>
              מידע
            </h3>
            <ul className={styles.linkList}>
              <li>
                <Link href={ROUTES.ABOUT}>אודות</Link>
              </li>
              <li>
                <Link href={ROUTES.ACCESSIBILITY}>הצהרת נגישות</Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className={styles.bottom}>
        <span className={styles.copyright}>
          © {new Date().getFullYear()} תיאטרון בישראל • כל הזכויות שמורות
        </span>
        <button
          type="button"
          className={styles.backToTop}
          onClick={scrollToTop}
          aria-label="חזרה לראש הדף"
        >
          <ChevronUpIcon />
          <span>חזרה למעלה</span>
        </button>
      </div>
    </footer>
  );
}
