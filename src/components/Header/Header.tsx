"use client";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import Logo from "@/components/Logo/Logo";
import { usePathname } from "next/navigation";
import Button from "@/components/Button/Button";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const fullName = session?.user?.name?.trim() || "";
  const firstName = fullName.split(/\s+/).filter(Boolean)[0] || "";
  const isWriteReviewPage =
    pathname === ROUTES.REVIEWS_NEW || pathname.endsWith("/review");
  const isMyAreaPage =
    pathname === ROUTES.MY_REVIEWS || pathname.startsWith(`${ROUTES.MY_REVIEWS}/`);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const accountMenuId = "header-account-menu";
  const mobileMenuId = "header-mobile-menu";
  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsAccountMenuOpen(false);
  };

  useEffect(() => {
    if (!headerRef.current) return;

    const root = document.documentElement;

    const updateHeaderOffset = () => {
      const height = Math.ceil(headerRef.current?.getBoundingClientRect().height ?? 0);
      if (height > 0) {
        root.style.setProperty("--header-offset", `${height}px`);
      }
    };

    updateHeaderOffset();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateHeaderOffset)
        : null;
    observer?.observe(headerRef.current);
    window.addEventListener("orientationchange", updateHeaderOffset);
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      observer?.disconnect();
      window.removeEventListener("orientationchange", updateHeaderOffset);
      window.removeEventListener("resize", updateHeaderOffset);
    };
  }, []);

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={styles.header} ref={headerRef}>
      <Logo />
      <div className={styles.topControls}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={isMobileMenuOpen ? "סגירת תפריט ניווט" : "פתיחת תפריט ניווט"}
          aria-controls={mobileMenuId}
          aria-expanded={isMobileMenuOpen}
          onClick={() => {
            setIsAccountMenuOpen(false);
            setIsMobileMenuOpen((prev) => !prev);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className={styles.menuToggleIcon}
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path
                fill="currentColor"
                d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
              />
            ) : (
              <path
                fill="currentColor"
                d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"
              />
            )}
          </svg>
          <span className={styles.menuToggleLabel}>תפריט</span>
        </button>
      </div>

      {isMobileMenuOpen ? (
        <button
          type="button"
          className={styles.mobileBackdrop}
          aria-label="סגירת תפריט"
          onClick={closeMenus}
        />
      ) : null}

      <div
        id={mobileMenuId}
        className={`${styles.menu} ${isMobileMenuOpen ? styles.menuOpen : ""}`}
        aria-label="תפריט ניווט"
      >
        <div className={styles.navSection}>
          <NavigationMenu.Root>
            <NavigationMenu.List className={styles.navList}>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild active={pathname === "/"}>
                  <Link href="/" className={styles.navText} onClick={closeMenus}>
                    עמוד הבית
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
              <NavigationMenu.Item>
                <NavigationMenu.Link asChild active={pathname === ROUTES.SHOWS}>
                  <Link href={ROUTES.SHOWS} className={styles.navText} onClick={closeMenus}>
                    כל ההצגות
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
          </NavigationMenu.Root>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.actions}>
            <Button
              href={ROUTES.REVIEWS_NEW}
              aria-label="כתיבת ביקורת"
              className={`${styles.primaryAction} ${styles.desktopOnlyAction}`}
              onClick={closeMenus}
            >
              לכתוב ביקורת
            </Button>
            <Link
              href={ROUTES.REVIEWS_NEW}
              className={`${styles.navText} ${styles.mobileMenuItem} ${isWriteReviewPage ? styles.mobileMenuItemActive : ""}`}
              aria-current={isWriteReviewPage ? "page" : undefined}
              onClick={closeMenus}
            >
              לכתוב ביקורת
            </Link>

            {isLoading ? (
              <button className={styles.authBtn} type="button" disabled>
                טוען...
              </button>
            ) : isAuthenticated ? (
              <>
                <div
                  className={`${styles.account} ${styles.desktopAccount}`}
                  ref={accountMenuRef}
                >
                  <Link
                    href={ROUTES.MY_REVIEWS}
                    className={styles.userIndicator}
                    aria-label={
                      fullName ? `מחובר/ת כ-${fullName}` : "מחובר/ת לחשבון"
                    }
                    onClick={closeMenus}
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
                      aria-expanded={isAccountMenuOpen}
                      aria-controls={accountMenuId}
                      onClick={() => setIsAccountMenuOpen((prev) => !prev)}
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

                    {isAccountMenuOpen ? (
                      <div className={styles.accountDropdown} id={accountMenuId}>
                        <Link
                          href={ROUTES.MY_REVIEWS}
                          className={styles.accountMenuItem}
                          onClick={closeMenus}
                        >
                          האזור האישי
                        </Link>
                        <Link
                          href={ROUTES.REVIEWS_NEW}
                          className={styles.accountMenuItem}
                          onClick={closeMenus}
                        >
                          לכתוב ביקורת
                        </Link>
                        <button
                          className={styles.accountMenuItemButton}
                          type="button"
                          onClick={() => {
                            closeMenus();
                            signOut({ callbackUrl: ROUTES.HOME });
                          }}
                        >
                          התנתקות
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={styles.mobileAccountLinks}>
                  <Link
                    href={ROUTES.MY_REVIEWS}
                    className={`${styles.navText} ${styles.mobileMenuItem} ${isMyAreaPage ? styles.mobileMenuItemActive : ""}`}
                    aria-current={isMyAreaPage ? "page" : undefined}
                    onClick={closeMenus}
                  >
                    האזור האישי
                  </Link>
                  <button
                    className={`${styles.navText} ${styles.mobileMenuButton}`}
                    type="button"
                    onClick={() => {
                      closeMenus();
                      signOut({ callbackUrl: ROUTES.HOME });
                    }}
                  >
                    התנתקות
                  </button>
                </div>
              </>
            ) : (
              <button
                className={styles.authBtn}
                type="button"
                onClick={() => {
                  closeMenus();
                  signIn("google", {
                    callbackUrl: pathname || ROUTES.HOME,
                  });
                }}
              >
                התחברות עם גוגל
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
