"use client";

import Link from "next/link";
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
  isMyReviewsPage: boolean;
  isMyWatchlistPage: boolean;
  onClose: () => void;
}

export default function MobileMenu({
  pathname,
  isAuthenticated,
  isLoading,
  fullName,
  firstName,
  isWriteReviewPage,
  isMyReviewsPage,
  isMyWatchlistPage,
  onClose,
}: MobileMenuProps) {
  return (
    <div className={styles.actionsSection}>
      <div className={styles.actions}>
        <Button
          href={ROUTES.REVIEWS_NEW}
          aria-label="כתב.י ביקורת"
          className={`${styles.primaryAction} ${styles.desktopOnlyAction}`}
          onClick={onClose}
        >
          כתב.י ביקורת
        </Button>
        <Link
          href={ROUTES.REVIEWS_NEW}
          className={cx(
            styles.navText,
            styles.mobileMenuItem,
            isWriteReviewPage && styles.mobileMenuItemActive,
          )}
          aria-current={isWriteReviewPage ? "page" : undefined}
          onClick={onClose}
        >
          כתב.י ביקורת
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
          </>
        )}
      </div>
    </div>
  );
}
