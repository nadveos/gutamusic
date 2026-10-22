import React from 'react';
import { Metadata } from 'next';
import { ArtistLoginClient } from './ArtistLoginClient';

export const metadata: Metadata = {
  title: 'Acceso para Artistas | GUTA MÚSICA',
  description: 'Iniciá sesión en tu panel de artista en GUTA MÚSICA.',
};

export default function LoginPage() {
  return <ArtistLoginClient />;
}
