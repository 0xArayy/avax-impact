import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AVAX Impact — Builder Attribution for Avalanche",
  description:
    "An open, ERC-8021-compatible builder-attribution layer for Avalanche C-Chain and EVM-based Avalanche L1s.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AVAX Impact",
    description: "See which builder generated an Avalanche transaction.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAX Impact",
    description: "See which builder generated an Avalanche transaction.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
