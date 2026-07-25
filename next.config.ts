import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      accounts: false,
      "@x402/evm": false,
      "@x402/svm": false,
      "@x402/svm/exact/client": false,
      "@x402/core": false,
    };
    return config;
  },
};

export default nextConfig;
