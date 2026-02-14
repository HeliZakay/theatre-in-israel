"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import styles from "../signin/page.module.css";

/* ── brand icons ────────────────────────────────────── */

function GoogleIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className={styles.socialIcon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.41c0-3.026 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971h-1.513c-1.49 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.098 24 12.073z"
        fill="#ffffff"
      />
    </svg>
  );
}

/* ── component ──────────────────────────────────────── */

interface SignUpFormProps {
  callbackUrl: string;
}

export default function SignUpForm({ callbackUrl }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (formData.password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || undefined,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "אירעה שגיאה ביצירת החשבון");
        setIsLoading(false);
        return;
      }

      // Auto sign in after successful signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("החשבון נוצר, אבל ההתחברות נכשלה. נסה להתחבר ידנית");
        setIsLoading(false);
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("אירעה שגיאה, נסה שנית");
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
          disabled={isLoading}
        >
          <GoogleIcon />
          הרשמה עם Google
        </button>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.facebookBtn}`}
          onClick={() => signIn("facebook", { callbackUrl })}
          disabled={isLoading}
        >
          <FacebookIcon />
          הרשמה עם Facebook
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
          הרשמה עם אימייל וסיסמה
        </button>
      ) : (
        <form onSubmit={handleSubmit} className={styles.credentialsForm}>
          <input
            type="text"
            placeholder="שם (אופציונלי)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
            disabled={isLoading}
            autoFocus
          />
          <input
            type="email"
            placeholder="אימייל"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className={styles.input}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={styles.input}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="אימות סיסמה"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
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
            {isLoading ? "יוצר חשבון..." : "הרשמה"}
          </button>
        </form>
      )}

      <p className={styles.signupPrompt}>
        כבר יש לך חשבון?{" "}
        <Link href={ROUTES.AUTH_SIGNIN} className={styles.signupLink}>
          התחבר
        </Link>
      </p>
    </div>
  );
}
