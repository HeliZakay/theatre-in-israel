import styles from "./page.module.css";
import ContactForm from "@/components/ContactForm/ContactForm";
import { SITE_NAME } from "@/lib/seo";
import ROUTES from "@/constants/routes";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "צור קשר",
  description: "יצירת קשר עם צוות תיאטרון בישראל — נשמח לשמוע מכם!",
  alternates: {
    canonical: ROUTES.CONTACT,
  },
  openGraph: {
    title: `צור קשר | ${SITE_NAME}`,
    description: "יצירת קשר עם צוות תיאטרון בישראל — נשמח לשמוע מכם!",
    url: ROUTES.CONTACT,
  },
};

export default function ContactPage() {
  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <p className={styles.kicker}>צור קשר</p>
        <h1 className={styles.title}>שלחו לנו הודעה</h1>
        <p className={styles.subtitle}>
          שאלה, הצעה, או סתם רוצים להגיד שלום? נשמח לשמוע מכם.
        </p>
      </header>

      <ContactForm />
    </main>
  );
}
