import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";

export const fontSans = Bricolage_Grotesque({
  variable: "--font-family-sans",
  subsets: ["latin"],
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  variable: "--font-family-mono",
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable}`;
