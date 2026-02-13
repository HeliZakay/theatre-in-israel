import { Frank_Ruhl_Libre } from "next/font/google";

/**
 * Single shared instance of Frank Ruhl Libre.
 * Import this instead of initializing the font in each component.
 */
export const titleFont = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["700"],
  variable: "--title-font",
  display: "swap",
});
