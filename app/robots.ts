import type { MetadataRoute } from "next";

const BASE_URL = "https://lacrypta.dev";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api"],
      },
    ],
    sitemap: [
      `${BASE_URL}/sitemap/static.xml`,
      `${BASE_URL}/sitemap/nostr.xml`,
    ],
    host: BASE_URL,
  };
}
