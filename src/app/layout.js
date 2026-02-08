import "./globals.css";
import Header from "@/components/layout/Header/Header";
import Footer from "@/components/layout/Footer/Footer";
import { Noto_Sans_Hebrew } from "next/font/google";

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
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
