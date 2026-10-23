import React from 'react';
import { Metadata } from 'next';
import { MusicDataService } from '../../lib/api';
import { ArtistsDirectoryClient } from './ArtistsDirectoryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Directorio de Artistas & Bandas Emergentes | GUTA MÚSICA',
  description: 'Explorá el catálogo de artistas independientes de folklore, rock, tango, hip hop y música urbana de Argentina y Latinoamérica.',
};

export default async function ArtistasPage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string }>;
}) {
  const params = await searchParams;
  const artists = await MusicDataService.getArtists();
  const genres = MusicDataService.getGenresList();

  // Orden prioritario para el directorio de artistas:
  // 1. Solo los marcados como Artista Destacado (featured && !featuredOfWeek)
  // 2. Artistas destacados de la semana (featuredOfWeek)
  // 3. Orden respectivo habitual (más recientes primero)
  const sortedArtists = [...artists].sort((a, b) => {
    const priorityA = a.featured && !a.featuredOfWeek ? 1 : a.featuredOfWeek ? 2 : 3;
    const priorityB = b.featured && !b.featuredOfWeek ? 1 : b.featuredOfWeek ? 2 : 3;
    return priorityA - priorityB;
  });

  return (
    <ArtistsDirectoryClient
      initialArtists={sortedArtists}
      genres={genres}
      initialGenre={params?.genre}
    />
  );
}
