import type { Metadata } from "next";
import { Manrope, Newsreader, DM_Mono } from "next/font/google";
import "./globals.css";
const body = Manrope({ variable: "--font-body", subsets: ["latin"] });
const display = Newsreader({ variable: "--font-display", subsets: ["latin"] });
const mono = DM_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });
export const metadata: Metadata = {
  title: "Nucleus — Biology + Chemistry",
  description: "Explore connected science concepts, save your favorites, and study with flashcards and quizzes.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable}`}><body>{children}</body></html>;
}
