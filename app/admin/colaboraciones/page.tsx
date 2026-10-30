import React from 'react';
import { AdminColaboracionesClient } from './AdminColaboracionesClient';
import { getContributionsFromDb, syncMercadoPagoDonations } from '../../../lib/services/mercadopagoService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Colaboraciones Voluntarias | GUTA CMS',
};

export default async function AdminColaboracionesPage() {
  let contributions = await getContributionsFromDb();

  if (contributions.length === 0) {
    try {
      const res = await syncMercadoPagoDonations(['185782556551']);
      contributions = res.contributions;
    } catch {}
  }

  return <AdminColaboracionesClient initialContributions={contributions} />;
}
