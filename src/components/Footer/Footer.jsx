import Link from "next/link";
import styles from "./Footer.module.css";
import { Frank_Ruhl_Libre } from "next/font/google";

const titleFont = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  variable: "--title-font",
  display: "swap",
});

export default function Footer() {
  return (
    <footer className={`${styles.footer} ${titleFont.variable}`}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.brand}>
          <p className={styles.brandTitle}>תיאטרון בישראל</p>
          <p className={styles.tagline}>
            ביקורות אמיתיות, המלצות חכמות, וערבים טובים יותר.
          </p>
          <div className={styles.metaRow}>
            <span>הצגות חדשות בכל שבוע</span>
            <span className={styles.dot}>•</span>
            <span>קהילה אוהבת במה</span>
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>ניווט</h3>
            <ul className={styles.linkList}>
              <li>
                <Link href="/">דף הבית</Link>
              </li>
              <li>
                <Link href="/shows">כל ההצגות</Link>
              </li>
              <li>
                <Link href="/reviews/new">כתיבת ביקורת</Link>
              </li>
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>צור קשר</h3>
            <ul className={styles.linkList}>
              <li>
                <a href="mailto:helizakay1@gmail.com">helizakay1@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© 2026 תיאטרון בישראל</span>
        <span className={styles.dot}>•</span>
        <span>כל הזכויות שמורות</span>
      </div>
    </footer>
  );
}
