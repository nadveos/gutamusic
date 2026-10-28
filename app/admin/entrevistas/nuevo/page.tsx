import React, { Suspense } from 'react';
import { MusicDataService } from '../../../../lib/api';
import { InterviewFormClient } from './InterviewFormClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Nueva Entrevista | GUTA CMS',
};

export default async function AdminNuevaEntrevistaPage() {
  const artists = await MusicDataService.getArtists();

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8c887f]">Cargando formulario...</div>}>
      <InterviewFormClient initialArtists={artists} />
    </Suspense>
  );
}
