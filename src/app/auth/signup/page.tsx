import Link from "next/link";
import ROUTES from "@/constants/routes";
import { isValidCallbackUrl } from "@/utils/auth";
import SignUpForm from "./SignUpForm";
import styles from "../signin/page.module.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "הרשמה",
  description: "הרשמה לאתר כדי לכתוב ולנהל ביקורות.",
  robots: {
    index: false,
    follow: false,
  },
};

interface SignUpPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawCallbackUrl = resolvedSearchParams.callbackUrl || ROUTES.HOME;
  const callbackUrl = isValidCallbackUrl(rawCallbackUrl)
    ? rawCallbackUrl
    : ROUTES.HOME;

  return (
    <main className={styles.page} id="main-content">
      <section className={styles.card}>
        <h1 className={styles.title}>הרשמה לאתר</h1>
        <p className={styles.subtitle}>
          צור חשבון חדש כדי לכתוב ביקורות ולנהל את הביקורות שלך.
        </p>
        <SignUpForm callbackUrl={callbackUrl} />
        <Link className={styles.backLink} href={ROUTES.HOME}>
          חזרה לעמוד הבית
        </Link>
      </section>
    </main>
  );
}
