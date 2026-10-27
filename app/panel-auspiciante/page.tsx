import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { SponsorDashboardClient } from './SponsorDashboardClient';

export const metadata: Metadata = {
  title: 'Panel de Auspiciante | GUTA MÚSICA',
  description: 'Gestioná tu campaña de publicidad, revisá los días restantes de tu auspicio y actualizá tus enlaces comerciales.',
};

export default function SponsorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111215] flex items-center justify-center text-[#e6cca0] text-sm">
          Cargando panel de auspiciante...
        </div>
      }
    >
      <SponsorDashboardClient />
    </Suspense>
  );
}
