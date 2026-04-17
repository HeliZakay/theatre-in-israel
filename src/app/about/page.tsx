import styles from "./page.module.css";
import { SITE_NAME } from "@/lib/seo";
import ROUTES from "@/constants/routes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות",
  description:
    "תיאטרון בישראל הוא פורטל ביקורות קהל להצגות — גלו הצגות, קראו ביקורות אמיתיות של צופים, ושתפו את החוויה שלכם.",
  alternates: {
    canonical: ROUTES.ABOUT,
  },
  openGraph: {
    title: `אודות | ${SITE_NAME}`,
    description:
      "תיאטרון בישראל הוא פורטל ביקורות קהל להצגות — גלו הצגות, קראו ביקורות אמיתיות של צופים, ושתפו את החוויה שלכם.",
    url: ROUTES.ABOUT,
  },
};

export default function AboutPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>אודות</p>
        <h1 className={styles.title}>תיאטרון בישראל</h1>
        <p className={styles.subtitle}>
          פורטל ביקורות קהל להצגות תיאטרון בכל רחבי הארץ.
        </p>
      </header>

      <div className={styles.content}>
        <section>
          <h2 className={styles.sectionTitle}>מה זה תיאטרון בישראל?</h2>
          <p>
            תיאטרון בישראל הוא פלטפורמה שנבנתה מתוך אהבה לבמה הישראלית. אנחנו
            מרכזים את כל ההצגות מהתיאטראות המובילים בארץ — ומאפשרים לצופים לגלות
            הצגות חדשות, לקרוא ביקורות אמיתיות של קהל, ולשתף את החוויה שלהם.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>למי זה מיועד?</h2>
          <p>
            לכל מי שאוהב תיאטרון. בין אם אתם מחפשים הצגה לערב הקרוב, רוצים
            לדעת מה שווה לראות, או פשוט רוצים לשתף את הדעה שלכם אחרי הופעה —
            הפלטפורמה שלנו פתוחה לכולם.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>איך זה עובד?</h2>
          <p>
            אנחנו אוספים מידע על הצגות ואירועים ישירות מאתרי התיאטראות, ומציגים
            אותם במקום אחד יחד עם ביקורות ודירוגים של הצופים. ככה אפשר לקבל
            תמונה מלאה לפני שקונים כרטיס.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>רוצים ליצור קשר?</h2>
          <p>
            יש לכם שאלה, הצעה, או סתם רוצים להגיד שלום? אתם מוזמנים{" "}
            <a href={ROUTES.CONTACT} className={styles.link}>
              לשלוח לנו הודעה
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
