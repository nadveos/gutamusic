import { ProfessionalCategoryKey } from '../types';

export interface ProfessionalCategoryInfo {
  key: ProfessionalCategoryKey;
  label: string;
  pluralLabel: string;
  shortDescription: string;
  placeholderSpecialty: string;
  badgeColor: string;
}

export const PROFESSIONAL_FEATURED_PRICE_ARS = 15000;
export const PROFESSIONAL_FEATURED_PRICE_USD = 12;
export const PROFESSIONAL_COURTESY_DAYS = 3;
export const PROFESSIONAL_PAID_DAYS = 7;

export const PROFESSIONAL_CATEGORIES: ProfessionalCategoryInfo[] = [
  {
    key: 'sello_independiente',
    label: 'Sello Independiente',
    pluralLabel: 'Sellos Independientes',
    shortDescription: 'Edición, distribución digital, management y desarrollo de catálogos independientes.',
    placeholderSpecialty: 'Ej: Sello discográfico de Rock/Indie & Distribución Digital',
    badgeColor: 'bg-[#e6cca0]/15 text-[#e6cca0] border-[#e6cca0]/40',
  },
  {
    key: 'productor_artistico',
    label: 'Productor Artístico',
    pluralLabel: 'Productores Artísticos',
    shortDescription: 'Dirección artística de discos, pre-producción, coaching de estudio y concepto sonoro.',
    placeholderSpecialty: 'Ej: Dirección artística integral para solistas y bandas',
    badgeColor: 'bg-[#d97d64]/15 text-[#d97d64] border-[#d97d64]/40',
  },
  {
    key: 'productor_musical',
    label: 'Productor Musical',
    pluralLabel: 'Productores Musicales',
    shortDescription: 'Grabación, beatmaking, mezcla, mastering y producción técnica de canciones.',
    placeholderSpecialty: 'Ej: Producción musical, Beatmaking, Mezcla & Mastering',
    badgeColor: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/40',
  },
  {
    key: 'dj',
    label: 'DJ',
    pluralLabel: "DJ's",
    shortDescription: 'Sets en vivo, eventos, fiestas, festivales, remixers y musicalización.',
    placeholderSpecialty: 'Ej: DJ Set House / Techno / Cachengue / Eventos',
    badgeColor: 'bg-[#c084fc]/15 text-[#c084fc] border-[#c084fc]/40',
  },
  {
    key: 'profesor_instrumento',
    label: 'Profesor de Instrumentos',
    pluralLabel: 'Profesores de Instrumentos',
    shortDescription: 'Clases particulares o grupales de guitarra, piano, batería, bajo, violín, vientos y más.',
    placeholderSpecialty: 'Ej: Profesor de Guitarra Criolla/Eléctrica y Bajo (Todos los niveles)',
    badgeColor: 'bg-[#5ce487]/15 text-[#5ce487] border-[#5ce487]/40',
  },
  {
    key: 'profesor_canto',
    label: 'Profesor de Canto',
    pluralLabel: 'Profesores de Canto',
    shortDescription: 'Técnica vocal, respiración, repertorio, preparación para grabación y vivo.',
    placeholderSpecialty: 'Ej: Técnica vocal contemporánea, repertorio popular y lírico',
    badgeColor: 'bg-[#f472b6]/15 text-[#f472b6] border-[#f472b6]/40',
  },
  {
    key: 'armonizador',
    label: 'Armonizador / Arreglador',
    pluralLabel: 'Armonizadores & Arregladores',
    shortDescription: 'Arreglos vocales e instrumentales, armonización de voces, partituras y SADAIC.',
    placeholderSpecialty: 'Ej: Arreglos vocales para grupos folklóricos, coros y transcripciones',
    badgeColor: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/40',
  },
  {
    key: 'musico_sesionista',
    label: 'Músico Sesionista',
    pluralLabel: 'Músicos Sesionistas',
    shortDescription: 'Instrumentistas profesionales para grabación a distancia, en estudio o shows en vivo.',
    placeholderSpecialty: 'Ej: Baterista y percusionista sesionista (estudio a distancia y vivo)',
    badgeColor: 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/40',
  },
  {
    key: 'voz_sesionista',
    label: 'Voz Sesionista',
    pluralLabel: 'Voces Sesionistas',
    shortDescription: 'Cantantes y coristas sesionistas para grabación de coros, demos, jingles y shows en vivo.',
    placeholderSpecialty: 'Ej: Corista y primera voz sesionista (grabación en home studio propio)',
    badgeColor: 'bg-[#fb7185]/15 text-[#fb7185] border-[#fb7185]/40',
  },
];

export function getProfessionalCategoryInfo(key?: string): ProfessionalCategoryInfo {
  return (
    PROFESSIONAL_CATEGORIES.find((c) => c.key === key) || PROFESSIONAL_CATEGORIES[0]
  );
}
