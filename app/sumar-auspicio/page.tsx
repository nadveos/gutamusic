import React from 'react';
import { Metadata } from 'next';
import { SumarAuspicioClient } from './SumarAuspicioClient';

export const metadata: Metadata = {
  title: 'Sumar mi Auspicio / Marca | GUTA MÚSICA',
  description:
    'Contratá tu espacio publicitario por 30 días en GUTA MÚSICA. Posicioná tu luthería, sala de ensayo, estudio de grabación o marca junto al movimiento musical federal.',
};

export default function SumarAuspicioPage() {
  return <SumarAuspicioClient />;
}
