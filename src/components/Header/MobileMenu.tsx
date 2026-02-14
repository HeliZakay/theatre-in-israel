"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import { cx } from "@/utils/cx";
import ROUTES from "@/constants/routes";
import Button from "@/components/Button/Button";
import AccountDropdown from "./AccountDropdown";

interface MobileMenuProps {
  pathname: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  fullName: string;
  firstName: string;
  isWriteReviewPage: boolean;
  isMyAreaPage: boolean;
  onClose: () => void;
}

export default function MobileMenu({
  pathname,
  isAuthenticated,
  isLoading,
  fullName,
  firstName,
  isWriteReviewPage,
  isMyAreaPage,
  onClose,
}: MobileMenuProps) {
  return (
    <div className={styles.actionsSection}>
      <div className={styles.actions}>
        <Button
          href={ROUTES.REVIEWS_NEW}
          aria-label="כתיבת ביקורת"
          className={`${styles.primaryAction} ${styles.desktopOnlyAction}`}
          onClick={onClose}
        >
          לכתוב ביקורת
        </Button>
        <Link
          href={ROUTES.REVIEWS_NEW}
          className={cx(styles.navText, styles.mobileMenuItem, isWriteReviewPage && styles.mobileMenuItemActive)}
          aria-current={isWriteReviewPage ? "page" : undefined}
          onClick={onClose}
        >
          לכתוב ביקורת
        </Link>

        {isLoading ? (
          <button className={styles.authBtn} type="button" disabled>
            טוען...
          </button>
        ) : isAuthenticated ? (
          <>
            <AccountDropdown
              fullName={fullName}
              firstName={firstName}
              onNavigate={onClose}
            />

            <div className={styles.mobileAccountLinks}>
              <Link
                href={ROUTES.MY_REVIEWS}
                className={cx(styles.navText, styles.mobileMenuItem, isMyAreaPage && styles.mobileMenuItemActive)}
                aria-current={isMyAreaPage ? "page" : undefined}
                onClick={onClose}
              >
                האזור האישי
              </Link>
              <button
                className={`${styles.navText} ${styles.mobileMenuButton}`}
                type="button"
                onClick={() => {
                  onClose();
                  signOut({ callbackUrl: ROUTES.HOME });
                }}
              >
                התנתקות
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              href={`${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(
                pathname &&
                  pathname.startsWith("/") &&
                  !pathname.startsWith("//")
                  ? pathname
                  : ROUTES.HOME,
              )}`}
              className={`${styles.authBtn} ${styles.desktopOnlyAction}`}
              onClick={onClose}
            >
              התחברות
            </Link>
            <Link
              href={`${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(
                pathname &&
                  pathname.startsWith("/") &&
                  !pathname.startsWith("//")
                  ? pathname
                  : ROUTES.HOME,
              )}`}
              className={`${styles.navText} ${styles.mobileMenuItem}`}
              onClick={onClose}
            >
              התחברות
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
