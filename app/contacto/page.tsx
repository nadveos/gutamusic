import React from 'react';
import { ContactFormClient } from './ContactFormClient';

export const metadata = {
  title: 'Sumá tu Banda / Contacto | GUTA MÚSICA',
  description:
    'Convocatoria permanente para artistas, solistas y bandas emergentes de toda la Argentina. Postulá tu proyecto musical para formar parte del catálogo y notas de GUTA.',
  openGraph: {
    title: 'Sumá tu Banda / Proyecto a GUTA MÚSICA',
    description: 'Plataforma federal de difusión cultural y artística independiente.',
  },
};

export default function ContactoPage() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <ContactFormClient />
    </div>
  );
}
