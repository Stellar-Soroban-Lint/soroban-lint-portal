import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.wasm": { type: "asset" },
    },
  },
};

export default nextConfig;
