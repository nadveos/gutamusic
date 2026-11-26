import React from 'react';
import { Metadata } from 'next';
import { MusicDataService, getArgentinaDayMonth } from '../../lib/api';
import { EfemeridesClient } from './EfemeridesClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Efemérides Musicales Históricas | GUTA MÚSICA',
  description: 'Lanzamientos históricos, ingresos a Billboard, registros en SADAIC, festivales de Cosquín y homenajes de la música popular argentina y latinoamericana.',
  alternates: {
    canonical: '/efemerides',
  },
};

export default async function EfemeridesPage() {
  const { day, month } = getArgentinaDayMonth();
  const todayEphemerides = await MusicDataService.getTodayEphemerides(day, month);

  return (
    <EfemeridesClient
      initialItems={todayEphemerides}
      initialDay={day}
      initialMonth={month}
    />
  );
}
