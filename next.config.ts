import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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