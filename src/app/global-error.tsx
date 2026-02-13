"use client";
import Link from "next/link";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <main style={{ padding: 24 }} id="main-content">
          <h1>אירעה שגיאה</h1>
          <p>מצטערים — קרתה שגיאה במהלך טעינת הדף.</p>
          {process.env.NODE_ENV === "development" && error?.message ? (
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
              {error.message}
            </pre>
          ) : null}

          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button onClick={() => reset()}>נסה שוב</button>
            <Link href="/">חזור לדף הבית</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
