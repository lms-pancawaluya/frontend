import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import Layout from "./components/common/Layout";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "LMS Pancawaluya",
  description: "Platform pembelajaran Pancawaluya untuk Guru SMA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}