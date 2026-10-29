import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { AdminArtistasClient } from './AdminArtistasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Gestión de Artistas | GUTA CMS',
};

export default async function AdminArtistasPage() {
  const artists = await MusicDataService.getArtists();

  return <AdminArtistasClient initialArtists={artists} />;
}
