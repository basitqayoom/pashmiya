import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Pashmiya | Authentic Kashmiri Pashmina Shawls",
  description: "Discover handwoven Kashmiri Pashmina shawls of exceptional quality. Crafted with centuries of tradition for the discerning collector.",
  keywords: ["pashmina", "kashmiri shawls", "cashmere", "luxury shawls", "handwoven"],
  openGraph: {
    title: "Pashmiya | Authentic Kashmiri Pashmina Shawls",
    description: "Discover handwoven Kashmiri Pashmina shawls of exceptional quality.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
