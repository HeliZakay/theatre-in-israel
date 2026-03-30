"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";

/* ── Inline SVG icons (stroke-based, matching mobile drawer) ── */

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

interface AccountDropdownProps {
  fullName: string;
  firstName: string;
  onNavigate: () => void;
  mobile?: boolean;
}

export default function AccountDropdown({
  fullName,
  firstName,
  onNavigate,
  mobile,
}: AccountDropdownProps) {
  return (
    <div
      className={`${styles.account} ${mobile ? styles.mobileAccount : styles.desktopAccount}`}
    >
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={styles.userIndicator}
            aria-label={fullName ? `מחובר/ת כ-${fullName}` : "פעולות חשבון"}
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
            <svg
              className={styles.chevronIcon}
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
              <Link href={ROUTES.MY_PROFILE} onClick={onNavigate}>
                <UserIcon className={styles.accountMenuItemIcon} />
                האזור האישי
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={styles.accountMenuItem}>
              <Link href={ROUTES.MY_REVIEWS} onClick={onNavigate}>
                <StarIcon className={styles.accountMenuItemIcon} />
                הביקורות שלי
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={styles.accountMenuItem}>
              <Link href={ROUTES.MY_WATCHLIST} onClick={onNavigate}>
                <BookmarkIcon className={styles.accountMenuItemIcon} />
                רשימת הצפייה שלי
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className={styles.accountMenuDivider} />
            <DropdownMenu.Item
              className={styles.accountMenuItemButton}
              onSelect={() => {
                onNavigate();
                signOut({ callbackUrl: ROUTES.HOME });
              }}
            >
              <LogOutIcon className={styles.accountMenuItemIcon} />
              התנתקות
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
