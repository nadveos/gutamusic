import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { AdminAgendaClient } from './AdminAgendaClient';

export const metadata = {
  title: 'Gestión de Agenda | GUTA CMS',
};

export default async function AdminAgendaPage() {
  const events = await MusicDataService.getUpcomingEvents();

  return <AdminAgendaClient initialEvents={events} />;
}
