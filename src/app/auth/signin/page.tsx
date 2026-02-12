import Link from "next/link";
import ROUTES from "@/constants/routes";
import SignInButton from "./SignInButton";
import styles from "./page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "התחברות",
  description: "התחברות לחשבון כדי לכתוב ולנהל ביקורות.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; reason?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams.callbackUrl || ROUTES.HOME;
  const showAuthRequiredMessage = resolvedSearchParams.reason === "auth_required";

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.card}>
        <h1 className={styles.title}>התחברות לאתר</h1>
        {showAuthRequiredMessage ? (
          <p className={styles.notice}>כדי להמשיך, צריך להתחבר קודם לחשבון.</p>
        ) : null}
        <p className={styles.subtitle}>
          כדי לכתוב ביקורת ולנהל את הביקורות שלך, צריך להתחבר עם חשבון Google.
        </p>
        <SignInButton callbackUrl={callbackUrl} />
        <Link className={styles.backLink} href={ROUTES.HOME}>
          חזרה לעמוד הבית
        </Link>
      </section>
    </main>
  );
}
