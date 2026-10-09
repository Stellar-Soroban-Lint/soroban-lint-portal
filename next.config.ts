import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: process.env["NEXT_PUBLIC_BASE_PATH"] ?? "",
  turbopack: {
    rules: {
      "*.wasm": { type: "asset" },
    },
  },
};

export default nextConfig;
