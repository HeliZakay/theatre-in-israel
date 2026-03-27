"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import { cx } from "@/utils/cx";
import ROUTES from "@/constants/routes";
import Button from "@/components/ui/Button/Button";
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
  isContactPage: boolean;
  onClose: () => void;
}

/* ── Inline SVG icons (20×20, stroke-based) ── */

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}

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

export default function MobileMenu({
  pathname,
  isAuthenticated,
  isLoading,
  fullName,
  firstName,
  isWriteReviewPage,
  isMyReviewsPage,
  isMyWatchlistPage,
  isContactPage,
  onClose,
}: MobileMenuProps) {
  const isActive = (route: string, startsWith = false) =>
    startsWith ? pathname.startsWith(route) : pathname === route;

  return (
    <>
      {/* ── Desktop/tablet fallback (unchanged behavior) ── */}
      <div className={styles.actionsSection}>
        <div className={styles.actions}>
          <Button
            href={ROUTES.REVIEWS_NEW}
            aria-label="כתב.י ביקורת"
            className={`${styles.reviewAction} ${styles.desktopOnlyAction}`}
            onClick={onClose}
          >
            כתב.י ביקורת
          </Button>

          {isLoading ? (
            <button className={styles.authBtn} type="button" disabled>
              טוען...
            </button>
          ) : isAuthenticated ? (
            <AccountDropdown
              fullName={fullName}
              firstName={firstName}
              onNavigate={onClose}
            />
          ) : (
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
          )}
        </div>
      </div>

      {/* ── Mobile drawer content ── */}
      <div className={styles.drawerHeader}>
        <span className={styles.drawerTitle}>תפריט</span>
        <button type="button" className={styles.drawerClose} aria-label="סגירת תפריט" onClick={onClose}>
          <svg className={styles.drawerCloseIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.drawerBody}>
        {/* Group 1: Browse */}
        <nav className={styles.drawerGroup}>
          <Link
            href={ROUTES.EVENTS}
            className={cx(styles.drawerItem, isActive(ROUTES.EVENTS, true) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <CalendarIcon className={styles.drawerItemIcon} />
            לוח הופעות
          </Link>
          <Link
            href={ROUTES.SHOWS}
            className={cx(styles.drawerItem, isActive(ROUTES.SHOWS) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <GridIcon className={styles.drawerItemIcon} />
            קטלוג הצגות
          </Link>
        </nav>

        <hr className={styles.drawerDivider} />

        {/* Group 2: Explore */}
        <nav className={styles.drawerGroup}>
          <Link
            href={ROUTES.THEATRES}
            className={cx(styles.drawerItem, isActive(ROUTES.THEATRES, true) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <BuildingIcon className={styles.drawerItemIcon} />
            תיאטראות
          </Link>
          <Link
            href={ROUTES.GENRES}
            className={cx(styles.drawerItem, isActive(ROUTES.GENRES, true) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <TagIcon className={styles.drawerItemIcon} />
            ז׳אנרים
          </Link>
          <Link
            href={ROUTES.CITIES}
            className={cx(styles.drawerItem, isActive(ROUTES.CITIES, true) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <MapPinIcon className={styles.drawerItemIcon} />
            ערים
          </Link>
          <Link
            href={ROUTES.ACTORS}
            className={cx(styles.drawerItem, isActive(ROUTES.ACTORS, true) && styles.drawerItemActive)}
            onClick={onClose}
          >
            <UsersIcon className={styles.drawerItemIcon} />
            שחקנים
          </Link>
        </nav>

        <hr className={styles.drawerDivider} />

        {/* Group 3: Actions */}
        <nav className={styles.drawerGroup}>
          <Link
            href={ROUTES.CONTACT}
            className={cx(styles.drawerItem, isContactPage && styles.drawerItemActive)}
            onClick={onClose}
          >
            <MailIcon className={styles.drawerItemIcon} />
            צר.י קשר
          </Link>
          <Link
            href={ROUTES.REVIEWS_NEW}
            className={cx(styles.drawerItem, isWriteReviewPage && styles.drawerItemActive)}
            onClick={onClose}
          >
            <PenIcon className={styles.drawerItemIcon} />
            כתב.י ביקורת
          </Link>
        </nav>

        {/* Auth section */}
        <div className={styles.drawerAuthSection}>
          {isLoading ? null : isAuthenticated ? (
            <>
              <div className={styles.drawerUserRow}>
                <span className={styles.drawerUserAvatar} aria-hidden="true">
                  <svg className={styles.drawerUserAvatarIcon} viewBox="0 0 24 24" focusable="false">
                    <path
                      fill="currentColor"
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.5 0-6.5 2.2-7.6 5.3a1 1 0 0 0 .9 1.3h13.4a1 1 0 0 0 .9-1.3C18.5 16.2 15.5 14 12 14Z"
                    />
                  </svg>
                </span>
                <span className={styles.drawerUserName}>{fullName || "מחובר/ת"}</span>
              </div>
              <nav className={styles.drawerGroup}>
                <Link
                  href={ROUTES.MY_PROFILE}
                  className={cx(styles.drawerItem, isActive(ROUTES.MY_PROFILE) && styles.drawerItemActive)}
                  onClick={onClose}
                >
                  <UserIcon className={styles.drawerItemIcon} />
                  האזור האישי
                </Link>
                <Link
                  href={ROUTES.MY_REVIEWS}
                  className={cx(styles.drawerItem, isMyReviewsPage && styles.drawerItemActive)}
                  onClick={onClose}
                >
                  <StarIcon className={styles.drawerItemIcon} />
                  הביקורות שלי
                </Link>
                <Link
                  href={ROUTES.MY_WATCHLIST}
                  className={cx(styles.drawerItem, isMyWatchlistPage && styles.drawerItemActive)}
                  onClick={onClose}
                >
                  <BookmarkIcon className={styles.drawerItemIcon} />
                  רשימת הצפייה שלי
                </Link>
                <button
                  type="button"
                  className={styles.drawerItem}
                  onClick={() => {
                    onClose();
                    signOut({ callbackUrl: ROUTES.HOME });
                  }}
                >
                  <LogOutIcon className={styles.drawerItemIcon} />
                  התנתקות
                </button>
              </nav>
            </>
          ) : (
            <Link
              href={`${ROUTES.AUTH_SIGNIN}?callbackUrl=${encodeURIComponent(
                pathname &&
                  pathname.startsWith("/") &&
                  !pathname.startsWith("//")
                  ? pathname
                  : ROUTES.HOME,
              )}`}
              className={styles.drawerLoginBtn}
              onClick={onClose}
            >
              התחברות
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
