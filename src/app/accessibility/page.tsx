import styles from "./page.module.css";
import { SITE_NAME } from "@/lib/seo";
import ROUTES from "@/constants/routes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: `הצהרת הנגישות של ${SITE_NAME} — מחויבים לנגישות דיגיטלית לכלל הציבור.`,
  alternates: {
    canonical: ROUTES.ACCESSIBILITY,
  },
  openGraph: {
    title: `הצהרת נגישות | ${SITE_NAME}`,
    description: `הצהרת הנגישות של ${SITE_NAME} — מחויבים לנגישות דיגיטלית לכלל הציבור.`,
    url: ROUTES.ACCESSIBILITY,
  },
};

export default function AccessibilityPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>נגישות</p>
        <h1 className={styles.title}>הצהרת נגישות</h1>
        <p className={styles.subtitle}>
          מחויבים לנגישות דיגיטלית לכלל הציבור.
        </p>
      </header>

      <div className={styles.content}>
        <section>
          <h2 className={styles.sectionTitle}>המחויבות שלנו</h2>
          <p>
            אתר תיאטרון בישראל שואף להיות נגיש לכלל האוכלוסייה, לרבות אנשים עם
            מוגבלויות, בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
            נגישות לשירות), התשע״ג-2013, ובהתאם לתקן הישראלי ת״י 5568 ברמה AA.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>אמצעי הנגישות באתר</h2>
          <ul className={styles.list}>
            <li>מבנה סמנטי תקני עם תגיות HTML מתאימות</li>
            <li>תמיכה מלאה בניווט באמצעות מקלדת</li>
            <li>תמיכה בקוראי מסך ובטכנולוגיות מסייעות</li>
            <li>ניגודיות צבעים ברמת AA לפחות</li>
            <li>טקסט חלופי לתמונות</li>
            <li>תמיכה בכיוון קריאה מימין לשמאל (RTL)</li>
            <li>אתר רספונסיבי המותאם למכשירים ולגדלי מסך שונים</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>נתקלתם בבעיה?</h2>
          <p>
            אם נתקלתם בבעיית נגישות באתר, נשמח לשמוע ולטפל בכך. אתם מוזמנים{" "}
            <a href={ROUTES.CONTACT} className={styles.link}>
              לשלוח לנו הודעה
            </a>{" "}
            ואנחנו נחזור אליכם בהקדם.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>תאריך עדכון</h2>
          <p>הצהרת נגישות זו עודכנה לאחרונה באפריל 2026.</p>
        </section>
      </div>
    </main>
  );
}
