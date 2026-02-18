import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { WishlistProvider } from "@/context/WishlistContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        <CurrencyProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main>{children}</main>
              <Footer />
            </WishlistProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
