import React from 'react';
import { Metadata } from 'next';
import { SumarProfesionalClient } from './SumarProfesionalClient';

export const metadata: Metadata = {
  title: 'Registrar mis Servicios Musicales (3 Días Destacado Gratis) | GUTA MÚSICA',
  description:
    'Sumate como Sello Independiente, Productor Artístico o Musical, DJ, Profesor de Canto o Instrumento, Armonizador o Músico Sesionista en GUTA MÚSICA.',
};

export default function SumarProfesionalPage() {
  return <SumarProfesionalClient />;
}
