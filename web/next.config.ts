import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false, // keep the projector view clean in `npm run dev`
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
