import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/product/:category(phone|laptop|tablet)/:filename",
        destination: "/product/:filename",
      },
    ];
  },
};

export default nextConfig;
