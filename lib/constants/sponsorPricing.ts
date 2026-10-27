import { AllianceSector } from '../types';

export interface SponsorPlan {
  id: AllianceSector;
  sector: AllianceSector;
  name: string;
  badge?: string;
  tagline: string;
  priceArs: number;
  durationDays: number;
  highlighted?: boolean;
  audience: string;
  locationDescription: string;
  benefits: string[];
}

export const SPONSOR_PLANS: SponsorPlan[] = [
  {
    id: 'global_footer',
    sector: 'global_footer',
    name: 'Pie de Página Global',
    badge: '🌟 El Más Elegido (Máxima Visibilidad)',
    tagline: 'Presencia transversal en el 100% de las páginas de la plataforma',
    priceArs: 36000,
    durationDays: 30,
    highlighted: true,
    audience: 'Audiencia general, oyentes, músicos, gestores y productores de todo el país.',
    locationDescription: 'Se exhibe en la base de todas las secciones del portal (Home, Directorio de Artistas, Entrevistas, Videoteca, Agenda y Notas) sin interrumpir la lectura.',
    benefits: [
      'Visualización garantizada en todas las páginas y URLs de Guta',
      'Logo adaptativo con enlace directo a tu WhatsApp y Web',
      'Exposición continua durante 30 días corridos',
      'Pill de categoría personalizada para tu rubro',
      'Renovación opcional con 1 clic al finalizar',
    ],
  },
  {
    id: 'home_mid',
    sector: 'home_mid',
    name: 'Portada Principal (Home)',
    badge: '🔥 Gran Impacto en Portada',
    tagline: 'Bloque intermedio en la página de inicio más visitada',
    priceArs: 29500,
    durationDays: 30,
    audience: 'Público que ingresa a descubrir los nuevos talentos y lanzamientos federales.',
    locationDescription: 'Ubicado estratégicamente en la portada entre el catálogo de artistas incorporados y las entrevistas exclusivas.',
    benefits: [
      'Posicionamiento central en la portada principal',
      'Contacto directo con click a WhatsApp y Web comercial',
      'Ideal para lanzamientos de productos, indumentaria y marcas culturales',
      'Vigencia por 30 días exactos con métricas de visibilidad',
    ],
  },
  {
    id: 'artistas_catalog',
    sector: 'artistas_catalog',
    name: 'Directorio de Artistas',
    badge: '🎸 Audiencia 100% Músicos y Bandas',
    tagline: 'Llegá a los músicos que buscan salas, luthiers y estudios de grabación',
    priceArs: 18500,
    durationDays: 30,
    audience: 'Músicos, cantantes, bandas independientes, compositores y managers.',
    locationDescription: 'Se muestra en el catálogo completo de artistas independientes y en los filtros por provincia y género.',
    benefits: [
      'Segmentación precisa hacia músicos que necesitan servicios técnicos',
      'Ideal para Luthiers, Salas de Ensayo, Estudios de Grabación y Audio',
      'Enlace directo a tu WhatsApp de contrataciones',
      'Presencia activa durante 30 días',
    ],
  },
  {
    id: 'agenda_events',
    sector: 'agenda_events',
    name: 'Agenda & Festivales',
    badge: '🎟️ Audiencia de Espectáculos en Vivo',
    tagline: 'Conectá con personas que salen a recitales, peñas y festivales',
    priceArs: 21000,
    durationDays: 30,
    audience: 'Público que asiste a recitales, turistas culturales y productores de eventos.',
    locationDescription: 'Exhibido en la cartelera de fechas de recitales, festivales y encuentros culturales en vivo.',
    benefits: [
      'Ideal para Bares culturales, Gastronomía, Hotelería y Ticketeras',
      'Llegada a personas con decisión de compra para salidas nocturnas',
      'Botones rápidos de llamada y WhatsApp',
      'Vigencia de 30 días corridos',
    ],
  },
  {
    id: 'all_sections',
    sector: 'all_sections',
    name: 'Pack Premium Transversal',
    badge: '👑 Cobertura Total (Ahorro 35%)',
    tagline: 'Tu marca presente simultáneamente en todos los bloques del ecosistema',
    priceArs: 49000,
    durationDays: 30,
    audience: 'Todas las audiencias integradas: músicos, público general, turistas y prensa.',
    locationDescription: 'Aparece en la Portada, Directorio de Artistas, Agenda de Eventos y en el Pie de Página Global.',
    benefits: [
      'Presencia combinada en Portada, Catálogo, Agenda y Footer Global',
      'Prioridad de aparición frente a auspicios individuales',
      'Máxima recordación de marca para empresas y patrocinadores oficiales',
      'Ahorro del 35% en comparación a contratar secciones individuales',
      'Vigencia por 30 días corridos',
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
