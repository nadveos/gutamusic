import React from 'react';
import { Metadata } from 'next';
import { AdminUsuariosClient } from './AdminUsuariosClient';

export const metadata: Metadata = {
  title: 'Gestión de Usuarios & Cuentas | GUTA CMS',
  description: 'Administración de cuentas de artistas, verificación OTP y vinculación de perfiles en GUTA MÚSICA.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsuariosPage() {
  return <AdminUsuariosClient />;
}
