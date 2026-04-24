import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Vercel's output file tracer includes `next/headers`, which is
  // loaded via a `webpackIgnore`'d dynamic import in src/lib/supabaseClient.ts
  // (the indirection prevents the tracer from seeing it as a static dep).
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/next/dist/**/headers*"],
  },
};

export default nextConfig;
