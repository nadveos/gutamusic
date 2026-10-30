import { AllianceSector } from '../types';

export interface SponsorPlan {
  id: AllianceSector;
  sector: AllianceSector;
  name: string;
  badge?: string;
  tagline: string;
  priceArs: number;
  priceUsd: number;
  durationDays: number;
  highlighted?: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
  audience: string;
  locationDescription: string;
  benefits: string[];
}

export const SPONSOR_PLANS: SponsorPlan[] = [
  {
    id: 'artistas_catalog',
    sector: 'artistas_catalog',
    name: 'Directorio Artistas',
    badge: '🎸 Nicho Músicos',
    tagline: 'Llegá a músicos que buscan salas, luthiers y estudios',
    priceArs: 18500,
    priceUsd: 15,
    durationDays: 30,
    audience: 'Músicos, solistas, bandas independientes y compositores.',
    locationDescription: 'Se muestra en el catálogo completo de artistas independientes y filtros por provincia.',
    benefits: [
      'Segmentación directa hacia músicos y bandas',
      'Ideal para Luthiers, Salas y Estudios',
      'Enlace directo a WhatsApp y Redes',
    ],
  },
  {
    id: 'agenda_events',
    sector: 'agenda_events',
    name: 'Agenda & Festivales',
    badge: '🎟️ Cartelera & Salidas',
    tagline: 'Conectá con personas que salen a recitales y peñas',
    priceArs: 21000,
    priceUsd: 18,
    durationDays: 30,
    audience: 'Público que asiste a recitales, turistas y productores de eventos.',
    locationDescription: 'Exhibido en la cartelera de fechas de recitales, festivales y encuentros culturales.',
    benefits: [
      'Público con alta intención de salida y consumo',
      'Ideal para Bares, Gastronomía y Hotelería',
      'Botón de llamada rápida y WhatsApp',
    ],
  },
  {
    id: 'home_mid',
    sector: 'home_mid',
    name: 'Portada Principal',
    badge: '⭐ MÁS ELEGIDO',
    tagline: 'Posicionamiento privilegiado en la portada más visitada',
    priceArs: 29500,
    priceUsd: 25,
    durationDays: 30,
    highlighted: true,
    isPopular: true,
    audience: 'Público general y músicos que ingresan a diario a descubrir lanzamientos.',
    locationDescription: 'Ubicado en la portada principal junto al reproductor y los artistas recomendados.',
    benefits: [
      'Ubicación central en el lateral de la Home',
      'Excelente relación visibilidad / costo',
      'Contacto comercial directo por WhatsApp y Web',
    ],
  },
  {
    id: 'global_footer',
    sector: 'global_footer',
    name: 'Pie de Página Global',
    badge: '🌐 100% de la Web',
    tagline: 'Presencia continua en todas las páginas del portal',
    priceArs: 36000,
    priceUsd: 30,
    durationDays: 30,
    audience: 'Audiencia general, oyentes, músicos y gestores de todo el país.',
    locationDescription: 'Se exhibe en la base de todas las secciones del portal sin interrumpir la lectura.',
    benefits: [
      'Visibilidad garantizada en todas las URLs de Guta',
      'Logo adaptativo y categoría destacada',
      'Exposición continua por 30 días corridos',
    ],
  },
  {
    id: 'all_sections',
    sector: 'all_sections',
    name: 'Pack Premium Total',
    badge: '👑 MÁS CONVENIENTE',
    tagline: 'Billboard horizontal scroll-reveal en Home + cobertura en toda la web',
    priceArs: 49000,
    priceUsd: 40,
    durationDays: 30,
    highlighted: true,
    isBestValue: true,
    audience: 'Todas las audiencias integradas con máximo impacto visual.',
    locationDescription: 'Billboard horizontal exclusivo debajo del Hero de Consagrados + Portada + Artistas + Footer.',
    benefits: [
      'Billboard panorámico animado scroll-reveal en Portada',
      'Presencia simultánea en TODAS las secciones de Guta',
      'Máxima prioridad y distinción como Patrocinador Oficial',
    ],
  },
];

export function getPlanBySector(sector: AllianceSector): SponsorPlan {
  const plan = SPONSOR_PLANS.find((p) => p.sector === sector);
  return plan || SPONSOR_PLANS[0];
}

/**
 * Calcula la fecha de expiración sumando 30 días a la fecha base
 */
export function calculateExpirationDate(startDate: Date = new Date()): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

/**
 * Calcula días restantes de vigencia de un auspicio
 */
export function getDaysRemaining(endDate?: string): { days: number; isExpired: boolean; label: string } {
  if (!endDate) {
    return { days: 0, isExpired: false, label: 'Sin vencimiento (Cortesía)' };
  }

  const end = new Date(endDate);
  const now = new Date();
  // Limpiar horas para cálculo por día
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (days <= 0) {
    return { days: 0, isExpired: true, label: 'Vencido' };
  }
  return { days, isExpired: false, label: `${days} ${days === 1 ? 'día restante' : 'días restantes'}` };
}
