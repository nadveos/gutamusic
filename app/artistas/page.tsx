import React from 'react';
import { Metadata } from 'next';
import { MusicDataService } from '../../lib/api';
import { ArtistsDirectoryClient } from './ArtistsDirectoryClient';

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

  return (
    <ArtistsDirectoryClient
      initialArtists={artists}
      genres={genres}
      initialGenre={params?.genre}
    />
  );
}
