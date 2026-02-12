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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuId = "header-account-menu";

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
            <div className={styles.account} ref={accountMenuRef}>
              <Link
                href={ROUTES.MY_REVIEWS}
                className={styles.userIndicator}
                aria-label={
                  fullName ? `מחובר/ת כ-${fullName}` : "מחובר/ת לחשבון"
                }
                onClick={() => setIsAccountMenuOpen(false)}
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
                    <path
                      fill="currentColor"
                      d="M7 10l5 5 5-5z"
                    />
                  </svg>
                </button>

                {isAccountMenuOpen ? (
                  <div className={styles.accountDropdown} id={accountMenuId}>
                    <Link
                      href={ROUTES.MY_REVIEWS}
                      className={styles.accountMenuItem}
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      האזור האישי
                    </Link>
                    <Link
                      href={ROUTES.REVIEWS_NEW}
                      className={styles.accountMenuItem}
                      onClick={() => setIsAccountMenuOpen(false)}
                    >
                      לכתוב ביקורת
                    </Link>
                    <button
                      className={styles.accountMenuItemButton}
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        signOut({ callbackUrl: ROUTES.HOME });
                      }}
                    >
                      התנתקות
                    </button>
                  </div>
                ) : null}
              </div>
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
