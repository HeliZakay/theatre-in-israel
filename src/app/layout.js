import "./globals.css";
import { Header, Footer } from "@/components";
import { Noto_Sans_Hebrew } from "next/font/google";
import RadixDirectionProvider from "@/components/RadixDirectionProvider/RadixDirectionProvider";

const textFont = Noto_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  variable: "--font-text",
  display: "swap",
});

export const metadata = {
  title: "תיאטרון בישראל",
  description: "ביקורות להצגות תיאטרון בישראל",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className={textFont.variable}>
        <RadixDirectionProvider dir="rtl">
          <a href="#main-content" className="skipLink">
            דלג לתוכן הראשי
          </a>
          <Header />
          {children}
          <Footer />
        </RadixDirectionProvider>
      </body>
    </html>
  );
}
