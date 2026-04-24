import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // src/lib/supabaseClient.ts loads `next/headers` via a webpackIgnore'd
  // dynamic import so the module stays out of client bundles. That hides
  // it from Vercel's output file tracer, so we explicitly force-include
  // the next package in every lambda.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/next/headers.js",
      "./node_modules/next/headers.d.ts",
      "./node_modules/next/dist/**",
    ],
  },
};

export default nextConfig;
