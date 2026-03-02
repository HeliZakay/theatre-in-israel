import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import styles from "./ReviewAuthGateway.module.css";

interface ReviewAuthGatewayProps {
  callbackUrl: string;
  backUrl?: string;
}

export default function ReviewAuthGateway({
  callbackUrl,
  backUrl,
}: ReviewAuthGatewayProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>כתיבת ביקורת</h1>
        <p className={styles.subtitle}>איך תרצה להמשיך?</p>

        <div className={styles.actions}>
          <Link
            className={styles.primaryBtn}
            href={`${ROUTES.AUTH_SIGNUP}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            הרשמה
          </Link>
          <Link
            className={styles.secondaryBtn}
            href={`${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            התחברות
          </Link>
        </div>

        <p className={styles.benefitNote}>
          עם חשבון תוכל.י לערוך ולמחוק ביקורות
        </p>

        <div className={styles.divider}>או</div>

        <Link className={styles.guestLink} href={`${callbackUrl}?guest=1`}>
          המשך בלי חשבון
        </Link>

        <Link className={styles.backLink} href={backUrl || ROUTES.HOME}>
          → חזרה
        </Link>
      </section>
    </main>
  );
}
