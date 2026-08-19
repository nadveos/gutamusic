import React, { Suspense } from 'react';
import { ArtistFormClient } from './ArtistFormClient';

export const metadata = {
  title: 'Alta / Edición de Artista | GUTA CMS',
};

export default function NuevoArtistaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8c887f]">Cargando formulario...</div>}>
      <ArtistFormClient />
    </Suspense>
  );
}
