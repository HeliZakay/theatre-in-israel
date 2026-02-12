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
  const { status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

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
            <button
              className={styles.authBtn}
              type="button"
              onClick={() => signOut({ callbackUrl: ROUTES.HOME })}
            >
              התנתקות
            </button>
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
