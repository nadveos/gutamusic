import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { EfemeridesAdminClient } from './EfemeridesAdminClient';

export const metadata = {
  title: 'Gestión de Efemérides | GUTA CMS',
};

export default async function AdminEfemeridesPage() {
  const allEphemerides = await MusicDataService.getAllEphemerides();

  return <EfemeridesAdminClient initialItems={allEphemerides} />;
}
