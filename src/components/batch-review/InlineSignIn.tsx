"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import { GoogleIcon } from "@/components/ui/SocialIcons/SocialIcons";
import { ROUTES } from "@/constants/routes";
import styles from "./InlineSignIn.module.css";

interface InlineSignInProps {
  onLoginSuccess: () => void;
  onBeforeGoogleRedirect: () => void;
}

export default function InlineSignIn({
  onLoginSuccess,
  onBeforeGoogleRedirect,
}: InlineSignInProps) {
  const { update } = useSession();
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
        await update();
        onLoginSuccess();
      }
    } catch {
      setError("אירעה שגיאה, נסו שוב");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    onBeforeGoogleRedirect();
    signIn("google", { callbackUrl: "/reviews/batch" });
  };

  const handleSignup = () => {
    onBeforeGoogleRedirect();
    window.location.href = `${ROUTES.AUTH_SIGNUP}?callbackUrl=${encodeURIComponent(ROUTES.REVIEWS_BATCH)}`;
  };

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>
        יש לך חשבון? התחבר/י כדי שהביקורות ישמרו תחת החשבון שלך
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.googleBtn}
          onClick={handleGoogleSignIn}
        >
          <GoogleIcon className={styles.socialIcon} />
          המשך עם Google
        </button>

        <div className={styles.divider}>
          <span>או</span>
        </div>

        {!showCredentials ? (
          <button
            type="button"
            className={styles.credentialsToggle}
            onClick={() => setShowCredentials(true)}
          >
            התחבר/י עם אימייל וסיסמה
          </button>
        ) : (
          <form onSubmit={handleCredentialsSignIn} className={styles.form}>
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
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? "מתחברים..." : "התחבר/י"}
            </button>
          </form>
        )}
      </div>

      <p className={styles.signupNote}>
        אין לך חשבון?{" "}
        <button type="button" className={styles.signupLink} onClick={handleSignup}>
          הרשמה
        </button>
      </p>
    </div>
  );
}
