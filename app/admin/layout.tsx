import React from 'react';
import { AdminLayoutClient } from '../../components/admin/AdminLayoutClient';

export const metadata = {
  title: 'Panel de Control CMS | GUTA MÚSICA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
