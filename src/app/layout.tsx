import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { brandTokens } from "@/lib/brand-tokens";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: brandTokens.name.product,
    template: `%s · ${brandTokens.name.product}`,
  },
  description:
    "Lead integrity, pipeline control, scoring, and nurture for Superpower Mentors — on top of HubSpot.",
  icons: {
    icon: brandTokens.assets.logoMark,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
