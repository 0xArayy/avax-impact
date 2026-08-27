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
  title: "AVAX Impact — Attribution Readiness Workbench",
  description:
    "Inspect declared attribution and preflight exact attributed calls on Avalanche Fuji, without a wallet or private keys.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AVAX Impact — Attribution Readiness Workbench",
    description: "Inspect and preflight AVAX Impact attribution on Avalanche Fuji.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AVAX Impact — Attribution Readiness Workbench",
    description: "Inspect and preflight AVAX Impact attribution on Avalanche Fuji.",
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
