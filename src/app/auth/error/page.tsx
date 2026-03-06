import Link from "next/link";
import ROUTES from "@/constants/routes";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "שגיאת התחברות",
  description: "אירעה שגיאה בתהליך ההתחברות.",
  robots: {
    index: false,
    follow: false,
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "כתובת האימייל הזו כבר משויכת לחשבון קיים עם שיטת התחברות אחרת. נס.י להתחבר עם השיטה המקורית.",
  Configuration: "יש בעיה בהגדרות השרת. נא לפנות למנהלי האתר.",
  AccessDenied: "הגישה נדחתה. אין לך הרשאה להתחבר.",
  Verification: "קישור האימות פג תוקף או שכבר נעשה בו שימוש. נס.י שוב.",
  OAuthSignin: "אירעה שגיאה בתחילת תהליך ההתחברות. נס.י שוב.",
  OAuthCallback: "אירעה שגיאה בתהליך ההתחברות מול Google. נס.י שוב.",
  Default: "אירעה שגיאה בלתי צפויה בתהליך ההתחברות. נס.י שוב.",
};

interface ErrorPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? ""] ?? ERROR_MESSAGES.Default;

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.card}>
        <h1 className={styles.title}>שגיאת התחברות</h1>
        <p className={styles.errorMessage}>{message}</p>
        <p className={styles.subtitle}>
          אם הבעיה חוזרת, נס.י לנקות את העוגיות של הדפדפן או לפנות אלינו.
        </p>
        <Link href={ROUTES.AUTH_SIGNIN} className={styles.signInLink}>
          חזרה לדף ההתחברות
        </Link>
        <Link className={styles.backLink} href={ROUTES.HOME}>
          חזרה לדף הבית
        </Link>
      </section>
    </main>
  );
}
