import React from 'react';
import { MusicDataService } from '../../../lib/api';
import { AdminSocialsClient } from './AdminSocialsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gestión de Redes Sociales @sesionesrg | GUTA CMS',
  description: 'Panel de configuración de canales oficiales y streaming de @sesionesrg (TikTok, Facebook, Instagram, Kick y Twitch)',
};

export default async function AdminRedesPage() {
  const socials = await MusicDataService.getOfficialSocials();

  return <AdminSocialsClient initialSettings={socials} />;
}
