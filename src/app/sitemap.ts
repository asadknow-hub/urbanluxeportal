import type { MetadataRoute } from "next";
import { COMMUNITIES, LISTINGS } from "@/lib/web/listings";
import { INSIGHT_ARTICLES } from "@/lib/web/insights";

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    "https://urbanluxe.com"
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const staticRoutes = [
    "",
    "/buy",
    "/rent",
    "/off-plan",
    "/mortgages",
    "/careers",
    "/insights",
    "/sell",
    "/valuations",
    "/property-management",
    "/communities",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const properties = LISTINGS.map((l) => ({
    url: `${base}/properties/${l.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const insights = INSIGHT_ARTICLES.map((i) => ({
    url: `${base}/insights/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const communities = COMMUNITIES.map((c) => ({
    url: `${base}/communities/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...properties, ...insights, ...communities];
}
