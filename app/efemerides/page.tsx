import React from 'react';
import { Metadata } from 'next';
import { MusicDataService } from '../../lib/api';
import { EfemeridesClient } from './EfemeridesClient';

export const metadata: Metadata = {
  title: 'Efemérides Musicales Históricas | GUTA MÚSICA',
  description: 'Lanzamientos históricos, ingresos a Billboard, registros en SADAIC, festivales de Cosquín y homenajes de la música popular argentina y latinoamericana.',
};

export default async function EfemeridesPage() {
  const allEphemerides = await MusicDataService.getAllEphemerides();

  return <EfemeridesClient initialItems={allEphemerides} />;
}
