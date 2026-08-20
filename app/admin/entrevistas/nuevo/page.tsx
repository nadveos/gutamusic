import React from 'react';
import { MusicDataService } from '../../../../lib/api';
import { InterviewFormClient } from './InterviewFormClient';

export const metadata = {
  title: 'Nueva Entrevista | GUTA CMS',
};

export default async function AdminNuevaEntrevistaPage() {
  const artists = await MusicDataService.getArtists();

  return <InterviewFormClient initialArtists={artists} />;
}
