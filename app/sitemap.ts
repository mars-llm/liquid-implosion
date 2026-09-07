import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://mars-llm.github.io/liquid-implosion/',
      changeFrequency: 'daily',
      priority: 1,
    },
  ];
}
