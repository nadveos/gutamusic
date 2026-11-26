import { MetadataRoute } from 'next';
import { MusicDataService } from '../lib/api';
import { getProfessionalsFromDb } from '../lib/services/professionalsService';

export const revalidate = 3600; // Revalidar el sitemap cada 1 hora

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar').replace(/\/+$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [artists, interviews, professionals] = await Promise.all([
    MusicDataService.getArtists().catch(() => []),
    MusicDataService.getInterviews().catch(() => []),
    getProfessionalsFromDb({ onlyActive: true }).catch(() => []),
  ]);

  const now = new Date();

  // Rutas estáticas públicas (sin /agenda porque redirige a /artistas)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/artistas`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/profesionales`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/entrevistas`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/efemerides`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contacto`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Rutas dinámicas de artistas
  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter((artist) => Boolean(artist.slug))
    .map((artist) => ({
      url: `${SITE_URL}/artistas/${encodeURIComponent(artist.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Rutas dinámicas de entrevistas
  const interviewRoutes: MetadataRoute.Sitemap = interviews
    .filter((interview) => Boolean(interview.slug))
    .map((interview) => ({
      url: `${SITE_URL}/entrevistas/${encodeURIComponent(interview.slug)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  // Rutas dinámicas de profesionales
  const professionalRoutes: MetadataRoute.Sitemap = professionals
    .filter((prof) => Boolean(prof.slug || prof.id))
    .map((prof) => ({
      url: `${SITE_URL}/profesionales/${encodeURIComponent(prof.slug || prof.id)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  return [...staticRoutes, ...artistRoutes, ...interviewRoutes, ...professionalRoutes];
}
