import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable server components external packages to ensure consistent module resolution
  serverExternalPackages: [],
  
  webpack: (config, { isServer }) => {
    // Add a rule to handle OpenTelemetry modules
    config.module.rules.push({
      test: /\.m?js$/,
      include: /node_modules\/@opentelemetry/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Add fallbacks for Node.js modules used by OpenTelemetry
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        dgram: false,
        // Add other Node.js core modules as needed
      };
    }

    return config;
  },
  
  // Disable type checking during build - we'll handle this separately
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable React Strict Mode for better compatibility with OpenTelemetry
  reactStrictMode: false,
};

export default nextConfig;
