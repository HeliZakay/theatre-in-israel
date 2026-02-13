"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";

interface AccountDropdownProps {
  fullName: string;
  firstName: string;
  onNavigate: () => void;
}

export default function AccountDropdown({
  fullName,
  firstName,
  onNavigate,
}: AccountDropdownProps) {
  return (
    <div className={`${styles.account} ${styles.desktopAccount}`}>
      <Link
        href={ROUTES.MY_REVIEWS}
        className={styles.userIndicator}
        aria-label={fullName ? `מחובר/ת כ-${fullName}` : "מחובר/ת לחשבון"}
        onClick={onNavigate}
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

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={styles.accountMenuTrigger}
            aria-label="פעולות חשבון"
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
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={styles.accountDropdown}
            align="end"
            sideOffset={8}
          >
            <DropdownMenu.Item asChild className={styles.accountMenuItem}>
              <Link href={ROUTES.MY_REVIEWS} onClick={onNavigate}>
                האזור האישי
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={styles.accountMenuItem}>
              <Link href={ROUTES.REVIEWS_NEW} onClick={onNavigate}>
                לכתוב ביקורת
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className={styles.accountMenuItemButton}
              onSelect={() => {
                onNavigate();
                signOut({ callbackUrl: ROUTES.HOME });
              }}
            >
              התנתקות
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
