import React from 'react';
import type { Metadata } from 'next';
import { ContactFormClient } from './ContactFormClient';

export const metadata: Metadata = {
  title: 'Contacto & Soporte Oficial | GUTA MÚSICA',
  description:
    'Canales oficiales de atención humana de GUTA MÚSICA: contacto@guta.musica.ar para consultas comerciales, prensa y dudas generales, y soporte@guta.musica.ar para asistencia personalizada al artista.',
};

export default function ContactoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <ContactFormClient />
    </div>
  );
}
