import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ProfessionalDashboardClient } from './ProfessionalDashboardClient';

export const metadata: Metadata = {
  title: 'Mi Panel Profesional | GUTA MÚSICA',
  description:
    'Administrá tus servicios musicales, revisá los días restantes de tu destacado de cortesía o semanal y actualizá tus enlaces.',
};

export default function ProfessionalDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111215] flex items-center justify-center text-[#e6cca0] text-sm">
          Cargando panel profesional...
        </div>
      }
    >
      <ProfessionalDashboardClient />
    </Suspense>
  );
}
