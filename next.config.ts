import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },
};

let exported: NextConfig | ReturnType<typeof import("eve/next").withEve> = nextConfig;

if (process.env.HEYSALAD_EVE_ENABLED === "true") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withEve } = require("eve/next") as typeof import("eve/next");
  exported = withEve(nextConfig);
}

export default exported;
