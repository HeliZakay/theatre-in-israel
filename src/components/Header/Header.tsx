"use client";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Link from "next/link";
import styles from "./Header.module.css";
import ROUTES from "@/constants/routes";
import Logo from "@/components/Logo/Logo";
import { usePathname } from "next/navigation";
import Button from "@/components/Button/Button";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const fullName = session?.user?.name?.trim() || "";
  const firstName = fullName.split(/\s+/).filter(Boolean)[0] || "";

  return (
    <header className={styles.header}>
      <Logo />

      <div className={styles.menu}>
        <NavigationMenu.Root>
          <NavigationMenu.List className={styles.navList}>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={pathname === "/"}>
                <Link href="/" className={styles.navText}>
                  עמוד הבית
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild active={pathname === ROUTES.SHOWS}>
                <Link href={ROUTES.SHOWS} className={styles.navText}>
                  כל ההצגות
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            {isAuthenticated ? (
              <NavigationMenu.Item>
                <NavigationMenu.Link
                  asChild
                  active={pathname === ROUTES.MY_REVIEWS}
                >
                  <Link href={ROUTES.MY_REVIEWS} className={styles.navText}>
                    האזור האישי
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            ) : null}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className={styles.actions}>
          <Button href={ROUTES.REVIEWS_NEW} aria-label="כתיבת ביקורת">
            לכתוב ביקורת
          </Button>

          {isLoading ? (
            <button className={styles.authBtn} type="button" disabled>
              טוען...
            </button>
          ) : isAuthenticated ? (
            <div className={styles.account}>
              <Link
                href={ROUTES.MY_REVIEWS}
                className={styles.userIndicator}
                aria-label={
                  fullName ? `מחובר/ת כ-${fullName}` : "מחובר/ת לחשבון"
                }
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

              <details className={styles.accountMenu}>
                <summary
                  className={styles.accountMenuTrigger}
                  aria-label="פעולות חשבון"
                >
                  <svg
                    className={styles.accountMenuTriggerIcon}
                    viewBox="0 0 24 24"
                    focusable="false"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M7 10l5 5 5-5z"
                    />
                  </svg>
                </summary>
                <div className={styles.accountDropdown}>
                  <Link href={ROUTES.MY_REVIEWS} className={styles.accountMenuItem}>
                    האזור האישי
                  </Link>
                  <Link
                    href={ROUTES.REVIEWS_NEW}
                    className={styles.accountMenuItem}
                  >
                    לכתוב ביקורת
                  </Link>
                  <button
                    className={styles.accountMenuItemButton}
                    type="button"
                    onClick={() => signOut({ callbackUrl: ROUTES.HOME })}
                  >
                    התנתקות
                  </button>
                </div>
              </details>
            </div>
          ) : (
            <button
              className={styles.authBtn}
              type="button"
              onClick={() =>
                signIn("google", {
                  callbackUrl: pathname || ROUTES.HOME,
                })
              }
            >
              התחברות עם גוגל
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
