import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { AdminAlliancesClient } from './AdminAlliancesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestión de Auspiciantes & Alianzas | GUTA CMS',
};

export default async function AdminAliadosPage() {
  const alliances = await MusicDataService.getAlliances(undefined, false);

  return <AdminAlliancesClient initialAlliances={alliances} />;
}
