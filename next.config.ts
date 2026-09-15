import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pastikan Turbopack memakai folder frontend sebagai root workspace.
  // Ini mencegah Next.js mencari package-lock.json di folder parent.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ftmqfmyaspfmqvzmugkk.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "disdik.jabarprov.go.id",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
