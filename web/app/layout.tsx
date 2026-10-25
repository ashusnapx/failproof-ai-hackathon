import type { Metadata } from "next";
import { Bungee, JetBrains_Mono, Noto_Sans_Kannada, Work_Sans } from "next/font/google";
import "./globals.css";

const bungee = Bungee({ variable: "--font-board", subsets: ["latin"], weight: "400" });
const work = Work_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-data", subsets: ["latin"], weight: ["500", "700"] });
const kannada = Noto_Sans_Kannada({ variable: "--font-kannada", subsets: ["kannada"], weight: ["700", "800"] });

export const metadata: Metadata = {
  title: "TruePe · Who Said So?",
  description: "TruePe lets AI agents pay only what a human authorized in words. Every UPI payout checked at the tool call, built on Failproof AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${bungee.variable} ${work.variable} ${mono.variable} ${kannada.variable}`}>
      <body>{children}</body>
    </html>
  );
}
