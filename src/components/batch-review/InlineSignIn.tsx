"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { GoogleIcon } from "@/components/ui/SocialIcons/SocialIcons";
import { signup } from "@/app/auth/signup/actions";
import styles from "./InlineSignIn.module.css";

interface InlineSignInProps {
  onLoginSuccess: () => void;
  onSignupSuccess: () => void;
  onBeforeGoogleRedirect: () => void;
}

export default function InlineSignIn({
  onLoginSuccess,
  onSignupSuccess,
  onBeforeGoogleRedirect,
}: InlineSignInProps) {
  const { update } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setShowCredentials(false);
  };

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

  const handleCredentialsSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (password !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signup({
        name: name || undefined,
        email,
        password,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("החשבון נוצר, אבל ההתחברות נכשלה. נס.י להתחבר ידנית");
      } else {
        await update();
        onSignupSuccess();
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

  const isSignup = mode === "signup";

  return (
    <div className={styles.container}>
      <p className={styles.prompt}>
        {isSignup
          ? "צר.י חשבון חדש כדי שהביקורות ישמרו תחת החשבון שלך"
          : "יש לך חשבון? התחבר/י כדי שהביקורות ישמרו תחת החשבון שלך"}
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
            {isSignup ? "הרשמה עם אימייל וסיסמה" : "התחבר/י עם אימייל וסיסמה"}
          </button>
        ) : isSignup ? (
          <form onSubmit={handleCredentialsSignUp} className={styles.form}>
            <input
              type="text"
              placeholder="שם (אופציונלי)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              disabled={isLoading}
              autoFocus
            />
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={isLoading}
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
            <input
              type="password"
              placeholder="אימות סיסמה"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "יוצרים חשבון..." : "הרשמה"}
            </button>
          </form>
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
        {isSignup ? (
          <>
            כבר יש לך חשבון?{" "}
            <button type="button" className={styles.signupLink} onClick={switchMode}>
              התחבר/י
            </button>
          </>
        ) : (
          <>
            אין לך חשבון?{" "}
            <button type="button" className={styles.signupLink} onClick={switchMode}>
              הרשמה
            </button>
          </>
        )}
      </p>
    </div>
  );
}
