"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { GoogleIcon, FacebookIcon } from "@/components/SocialIcons/SocialIcons";
import styles from "./page.module.css";

/* ── component ──────────────────────────────────────── */

interface SignInButtonProps {
  callbackUrl: string;
}

export default function SignInButton({ callbackUrl }: SignInButtonProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("אימייל או סיסמה שגויים");
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("אירעה שגיאה, נסה שנית");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.signInContainer}>
      {/* ── social providers (prominent) ── */}
      <div className={styles.socialButtons}>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.googleBtn}`}
          onClick={() => signIn("google", { callbackUrl })}
        >
          <GoogleIcon className={styles.socialIcon} />
          המשך עם Google
        </button>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.facebookBtn}`}
          onClick={() => signIn("facebook", { callbackUrl })}
        >
          <FacebookIcon className={styles.socialIcon} />
          המשך עם Facebook
        </button>
      </div>

      <div className={styles.divider}>
        <span>או</span>
      </div>

      {/* ── credentials (expandable) ── */}
      {!showCredentials ? (
        <button
          type="button"
          className={styles.credentialsToggle}
          onClick={() => setShowCredentials(true)}
        >
          התחבר עם אימייל וסיסמה
        </button>
      ) : (
        <form
          onSubmit={handleCredentialsSignIn}
          className={styles.credentialsForm}
        >
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
            autoFocus
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
            disabled={isLoading}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.signInBtn}
            disabled={isLoading}
          >
            {isLoading ? "מתחבר..." : "התחבר"}
          </button>
        </form>
      )}
    </div>
  );
}
