"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import styles from "./Header.module.css";
import { cx } from "@/utils/cx";
import ROUTES from "@/constants/routes";
import Button from "@/components/ui/Button/Button";
import AccountDropdown from "./AccountDropdown";
import {
  CalendarIcon,
  GridIcon,
  BuildingIcon,
  TagIcon,
  MapPinIcon,
  UsersIcon,
  MailIcon,
  PenIcon,
  UserIcon,
  StarIcon,
  BookmarkIcon,
  LogOutIcon,
} from "./MobileMenuIcons";

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
            href={ROUTES.REVIEWS_BATCH}
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
            href={ROUTES.REVIEWS_BATCH}
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
