import type { NextConfig } from "next";

const backendHost = process.env.NEXT_PUBLIC_GAS_API_URL
  ? new URL(process.env.NEXT_PUBLIC_GAS_API_URL).origin
  : "*";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: backendHost },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
