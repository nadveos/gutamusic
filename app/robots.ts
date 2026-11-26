import { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar').replace(/\/+$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/panel-artista/', '/panel-auspiciante/', '/panel-profesional/', '/g/', '/guta/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
