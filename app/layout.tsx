import type { Metadata } from "next";
import "./globals.css";
import Layout from "./components/common/Layout";

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
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}