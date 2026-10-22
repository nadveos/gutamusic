import React from 'react';
import { Metadata } from 'next';
import { ArtistDashboardClient } from './ArtistDashboardClient';

export const metadata: Metadata = {
  title: 'Mi Panel de Artista | GUTA MÚSICA',
  description:
    'Panel de autogestión para bandas y solistas. Administrá tu biografía, discografía, próximos conciertos y vinculación con Spotify.',
};

export default function ArtistDashboardPage() {
  return <ArtistDashboardClient />;
}
