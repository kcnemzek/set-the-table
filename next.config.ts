import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("./package.json") as { version: string };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERSION: version,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "edamam-product-images.s3.amazonaws.com" },
      { protocol: "https", hostname: "www.edamam.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
