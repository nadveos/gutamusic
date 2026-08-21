import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { AdminEntrevistasClient } from './AdminEntrevistasClient';

export const metadata = {
  title: 'Gestión de Entrevistas | GUTA CMS',
};

export default async function AdminEntrevistasPage() {
  const interviews = await MusicDataService.getInterviews();

  return <AdminEntrevistasClient initialInterviews={interviews} />;
}
