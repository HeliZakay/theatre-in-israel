"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import { GoogleIcon, FacebookIcon } from "@/components/SocialIcons/SocialIcons";
import styles from "../signin/page.module.css";

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
          <GoogleIcon className={styles.socialIcon} />
          הרשמה עם Google
        </button>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.facebookBtn}`}
          onClick={() => signIn("facebook", { callbackUrl })}
          disabled={isLoading}
        >
          <FacebookIcon className={styles.socialIcon} />
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
