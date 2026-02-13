"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";

interface AccountDropdownProps {
  fullName: string;
  firstName: string;
  onNavigate: () => void;
}

const accountMenuId = "header-account-menu";

export default function AccountDropdown({
  fullName,
  firstName,
  onNavigate,
}: AccountDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    onNavigate();
  };

  return (
    <div className={`${styles.account} ${styles.desktopAccount}`} ref={menuRef}>
      <Link
        href={ROUTES.MY_REVIEWS}
        className={styles.userIndicator}
        aria-label={fullName ? `מחובר/ת כ-${fullName}` : "מחובר/ת לחשבון"}
        onClick={close}
      >
        <span className={styles.userAvatar} aria-hidden="true">
          <svg
            className={styles.userAvatarIcon}
            viewBox="0 0 24 24"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.5 0-6.5 2.2-7.6 5.3a1 1 0 0 0 .9 1.3h13.4a1 1 0 0 0 .9-1.3C18.5 16.2 15.5 14 12 14Z"
            />
          </svg>
        </span>
        <span className={styles.userName}>{firstName || "מחובר/ת"}</span>
      </Link>

      <div className={styles.accountMenu}>
        <button
          type="button"
          className={styles.accountMenuTrigger}
          aria-label="פעולות חשבון"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls={accountMenuId}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <svg
            className={styles.accountMenuTriggerIcon}
            viewBox="0 0 24 24"
            focusable="false"
            aria-hidden="true"
          >
            <path fill="currentColor" d="M7 10l5 5 5-5z" />
          </svg>
        </button>

        {isOpen ? (
          <div className={styles.accountDropdown} id={accountMenuId}>
            <Link
              href={ROUTES.MY_REVIEWS}
              className={styles.accountMenuItem}
              onClick={close}
            >
              האזור האישי
            </Link>
            <Link
              href={ROUTES.REVIEWS_NEW}
              className={styles.accountMenuItem}
              onClick={close}
            >
              לכתוב ביקורת
            </Link>
            <button
              className={styles.accountMenuItemButton}
              type="button"
              onClick={() => {
                close();
                signOut({ callbackUrl: ROUTES.HOME });
              }}
            >
              התנתקות
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
