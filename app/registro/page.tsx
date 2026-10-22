import React from 'react';
import { Metadata } from 'next';
import { ArtistRegisterClient } from './ArtistRegisterClient';

export const metadata: Metadata = {
  title: 'Registro de Artistas | GUTA MÚSICA',
  description:
    'Registrá tu banda, solista o ensamble en GUTA MÚSICA. Gestioná tu discografía, fechas en vivo, videos y conectá con el público federal.',
};

export default function RegisterPage() {
  return <ArtistRegisterClient />;
}
