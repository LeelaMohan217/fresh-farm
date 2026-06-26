import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NavigationProgress from "@/components/NavigationProgress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FarmFresh Admin",
  description: "FarmFresh organic products and hydroponic installation services",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
