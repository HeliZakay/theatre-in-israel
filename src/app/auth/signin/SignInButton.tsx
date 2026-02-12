"use client";

import { signIn } from "next-auth/react";
import styles from "./page.module.css";

interface SignInButtonProps {
  callbackUrl: string;
}

export default function SignInButton({ callbackUrl }: SignInButtonProps) {
  return (
    <button
      type="button"
      className={styles.signInBtn}
      onClick={() => signIn("google", { callbackUrl })}
    >
      המשך עם Google
    </button>
  );
}
