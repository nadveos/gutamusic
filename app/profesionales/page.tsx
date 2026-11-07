import React from 'react';
import { Metadata } from 'next';
import {
  getProfessionalsFromDb,
  getProfessionalFeaturedStatus,
} from '@/lib/services/professionalsService';
import {
  ProfessionalsDirectoryClient,
  EnrichedProfessional,
} from './ProfessionalsDirectoryClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Profesionales, Sellos, Productores, DJ's, Docentes & Sesionistas | GUTA MÚSICA",
  description:
    'Directorio federal de sellos independientes, productores artísticos y musicales, DJs, profesores de canto e instrumentos, armonizadores y músicos sesionistas.',
};

export default async function ProfesionalesPage() {
  const list = await getProfessionalsFromDb({ onlyActive: true });
  const enriched: EnrichedProfessional[] = list.map((item) => ({
    ...item,
    featuredStatus: getProfessionalFeaturedStatus(item),
  }));

  return <ProfessionalsDirectoryClient initialProfessionals={enriched} />;
}
