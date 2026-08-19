import { MetadataRoute } from 'next';
import { MusicDataService } from '../lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artists = await MusicDataService.getArtists();
  const interviews = await MusicDataService.getInterviews();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/artistas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/entrevistas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/efemerides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/agenda`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Dynamic artist routes
  const artistRoutes: MetadataRoute.Sitemap = artists.map((artist) => ({
    url: `${SITE_URL}/artistas/${artist.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic interview routes
  const interviewRoutes: MetadataRoute.Sitemap = interviews.map((interview) => ({
    url: `${SITE_URL}/entrevistas/${interview.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...artistRoutes, ...interviewRoutes];
}
