import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pashmiya.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout/', '/account/', '/cart/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
