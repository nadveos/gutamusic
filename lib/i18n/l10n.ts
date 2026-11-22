/**
 * GUTA MÚSICA — Sistema de Internacionalización (i18n / l10n estilo Flutter)
 * Idiomas soportados:
 * - es: Español (Argentina / Latinoamérica / España) — Default
 * - en: English (Internacional / EE.UU. / UK)
 * - pt: Português Brasileiro (Brasil / Portugal)
 * - fr: Français (Francia / Canadá / Bélgica)
 * - it: Italiano (Italia)
 */

export type SupportedLocale = 'es' | 'en' | 'pt' | 'fr' | 'it';

export interface LocaleMeta {
  code: SupportedLocale;
  label: string;
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleMeta[] = [
  { code: 'es', label: 'Español', shortLabel: 'ES', flag: '🇦🇷' },
  { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { code: 'pt', label: 'Português (BR)', shortLabel: 'PT', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', shortLabel: 'IT', flag: '🇮🇹' },
];

export interface L10nStrings {
  topBannerSubtitle: string;
  topBannerEphemeris: string;
  navHome: string;
  navArtists: string;
  navProfessionals: string;
  navInterviews: string;
  navEphemerides: string;
  navContact: string;
  exploreSearch: string;
  loginBtn: string;
  registerBandBtn: string;
  registerBandMobileBtn: string;
  donationTitle: string;
  donationBadge: string;
  donationSubtitle: string;
  donationOther: string;
  donationContributeBtn: string;
  footerMission: string;
  footerSections: string;
  footerGenres: string;
  footerContactChannels: string;
  footerCommercialPress: string;
  footerOpenForm: string;
  footerArtistSupport: string;
  footerEditorialDir: string;
  footerRights: string;
  footerMadeWith: string;
}

export const L10N_DICTIONARIES: Record<SupportedLocale, L10nStrings> = {
  es: {
    topBannerSubtitle: 'Plataforma Federal de Difusión para Artistas Independientes',
    topBannerEphemeris: 'Efeméride',
    navHome: 'Inicio',
    navArtists: 'Artistas',
    navProfessionals: 'Profesionales & Servicios',
    navInterviews: 'Entrevistas & Lives',
    navEphemerides: 'Efemérides',
    navContact: 'Contacto',
    exploreSearch: 'Explorar',
    loginBtn: 'Ingresar',
    registerBandBtn: 'Registrá tu Banda Gratis',
    registerBandMobileBtn: '+ Sumar Banda',
    donationTitle: 'Colaboración Voluntaria',
    donationBadge: 'Música Federal',
    donationSubtitle:
      'Difusión comunitaria y gratuita para artistas. Tu aporte nos ayuda a sostener la plataforma.',
    donationOther: 'Otro',
    donationContributeBtn: 'Aportar',
    footerMission:
      'Medio digital musical, agenda cultural y videoteca dedicada a descubrir, amplificar y visibilizar a artistas y bandas emergentes argentinas y latinoamericanas.',
    footerSections: 'Secciones',
    footerGenres: 'Géneros Principales',
    footerContactChannels: 'Canales de Contacto',
    footerCommercialPress: 'Comercial, Prensa & Dudas',
    footerOpenForm: 'Abrir formulario de consultas →',
    footerArtistSupport: 'Asistencia al Artista (Vía Directa)',
    footerEditorialDir: 'Dirección Editorial:',
    footerRights: 'Todos los derechos reservados.',
    footerMadeWith: 'Hecho con dedicación para la música emergente de América Latina',
  },
  en: {
    topBannerSubtitle: 'Federal Promotion Platform for Independent Artists',
    topBannerEphemeris: 'This Day in Music',
    navHome: 'Home',
    navArtists: 'Artists',
    navProfessionals: 'Pro & Services',
    navInterviews: 'Interviews & Lives',
    navEphemerides: 'Music History',
    navContact: 'Contact',
    exploreSearch: 'Search',
    loginBtn: 'Sign In',
    registerBandBtn: 'Register Your Band Free',
    registerBandMobileBtn: '+ Add Band',
    donationTitle: 'Voluntary Support',
    donationBadge: 'Indie Music',
    donationSubtitle:
      'Free community promotion for emerging artists. Your contribution helps sustain the platform.',
    donationOther: 'Custom',
    donationContributeBtn: 'Support',
    footerMission:
      'Digital music media, cultural calendar, and video library dedicated to discovering, amplifying, and showcasing emerging Argentine and Latin American artists.',
    footerSections: 'Sections',
    footerGenres: 'Main Genres',
    footerContactChannels: 'Contact Channels',
    footerCommercialPress: 'Commercial, Press & General',
    footerOpenForm: 'Open inquiry form →',
    footerArtistSupport: 'Artist Support (Direct Line)',
    footerEditorialDir: 'Editorial Director:',
    footerRights: 'All rights reserved.',
    footerMadeWith: 'Made with dedication for emerging music in Latin America',
  },
  pt: {
    topBannerSubtitle: 'Plataforma Federal de Difusão para Artistas Independentes',
    topBannerEphemeris: 'Efeméride Musical',
    navHome: 'Início',
    navArtists: 'Artistas',
    navProfessionals: 'Profissionais & Serviços',
    navInterviews: 'Entrevistas & Lives',
    navEphemerides: 'Efemérides',
    navContact: 'Contato',
    exploreSearch: 'Explorar',
    loginBtn: 'Entrar',
    registerBandBtn: 'Cadastre sua Banda Grátis',
    registerBandMobileBtn: '+ Somar Banda',
    donationTitle: 'Colaboração Voluntária',
    donationBadge: 'Música Independente',
    donationSubtitle:
      'Divulgação comunitária e gratuita para artistas. Seu apoio nos ajuda a manter a plataforma.',
    donationOther: 'Outro',
    donationContributeBtn: 'Apoiar',
    footerMission:
      'Mídia digital musical, agenda cultural e videoteca dedicada a descobrir, amplificar e dar visibilidade a artistas e bandas emergentes da Argentina e América Latina.',
    footerSections: 'Seções',
    footerGenres: 'Gêneros Principais',
    footerContactChannels: 'Canais de Contato',
    footerCommercialPress: 'Comercial, Imprensa & Dúvidas',
    footerOpenForm: 'Abrir formulário de consultas →',
    footerArtistSupport: 'Suporte ao Artista (Via Direta)',
    footerEditorialDir: 'Direção Editorial:',
    footerRights: 'Todos os direitos reservados.',
    footerMadeWith: 'Feito com dedicação para a música emergente da América Latina',
  },
  fr: {
    topBannerSubtitle: 'Plateforme Fédérale de Diffusion pour Artistes Indépendants',
    topBannerEphemeris: 'Éphéméride',
    navHome: 'Accueil',
    navArtists: 'Artistes',
    navProfessionals: 'Pros & Services',
    navInterviews: 'Interviews & Lives',
    navEphemerides: 'Éphémérides',
    navContact: 'Contact',
    exploreSearch: 'Explorer',
    loginBtn: 'Connexion',
    registerBandBtn: 'Inscrire Mon Groupe Gratuitement',
    registerBandMobileBtn: '+ Ajouter Groupe',
    donationTitle: 'Contribution Volontaire',
    donationBadge: 'Musique Indé',
    donationSubtitle:
      'Diffusion communautaire et gratuite pour les artistes. Votre soutien nous aide à maintenir la plateforme.',
    donationOther: 'Autre',
    donationContributeBtn: 'Soutenir',
    footerMission:
      'Média musical numérique, agenda culturel et vidéothèque dédiés à la découverte et à la promotion des artistes et groupes émergents d’Argentine et d’Amérique latine.',
    footerSections: 'Sections',
    footerGenres: 'Genres Principaux',
    footerContactChannels: 'Canaux de Contact',
    footerCommercialPress: 'Commercial, Presse & Questions',
    footerOpenForm: 'Ouvrir le formulaire →',
    footerArtistSupport: 'Assistance Artiste (Ligne Directe)',
    footerEditorialDir: 'Direction Éditoriale :',
    footerRights: 'Tous droits réservés.',
    footerMadeWith: 'Fait avec passion pour la musique émergente d’Amérique latine',
  },
  it: {
    topBannerSubtitle: 'Piattaforma Federale di Diffusione per Artisti Indipendenti',
    topBannerEphemeris: 'Accadde Oggi',
    navHome: 'Home',
    navArtists: 'Artisti',
    navProfessionals: 'Professionisti & Servizi',
    navInterviews: 'Interviste & Live',
    navEphemerides: 'Storia della Musica',
    navContact: 'Contatti',
    exploreSearch: 'Esplora',
    loginBtn: 'Accedi',
    registerBandBtn: 'Registra la Tua Band Gratis',
    registerBandMobileBtn: '+ Aggiungi Band',
    donationTitle: 'Contributo Volontario',
    donationBadge: 'Musica Indie',
    donationSubtitle:
      'Diffusione comunitaria e gratuita per gli artisti. Il tuo contributo ci aiuta a sostenere la piattaforma.',
    donationOther: 'Altro',
    donationContributeBtn: 'Sostieni',
    footerMission:
      'Media musicale digitale, agenda culturale e videoteca dedicata a scoprire, amplificare e dare visibilità ad artisti e band emergenti argentini e latinoamericani.',
    footerSections: 'Sezioni',
    footerGenres: 'Generi Principali',
    footerContactChannels: 'Canali di Contatto',
    footerCommercialPress: 'Commerciale, Stampa & Domande',
    footerOpenForm: 'Apri il modulo di contatto →',
    footerArtistSupport: 'Assistenza Artisti (Linea Diretta)',
    footerEditorialDir: 'Direzione Editoriale:',
    footerRights: 'Tutti i diritti riservati.',
    footerMadeWith: 'Realizzato con dedizione per la musica emergente dell’America Latina',
  },
};

const SPANISH_COUNTRIES = new Set([
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'ES', 'GQ',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PE', 'PR', 'PY', 'SV', 'UY', 'VE',
]);

const PORTUGUESE_COUNTRIES = new Set(['BR', 'PT', 'AO', 'MZ', 'CV']);
const FRENCH_COUNTRIES = new Set(['FR', 'MC', 'BE', 'LU', 'SN', 'CI', 'MA', 'TN']);
const ITALIAN_COUNTRIES = new Set(['IT', 'SM', 'VA']);

/**
 * Resuelve el idioma ideal a partir del código de país ISO (Geo-IP) y/o Accept-Language
 */
export function resolveLocaleFromCountryOrLang(
  countryCode?: string | null,
  acceptLanguage?: string | null
): SupportedLocale {
  const cc = (countryCode || '').trim().toUpperCase();

  if (cc) {
    if (SPANISH_COUNTRIES.has(cc)) return 'es';
    if (PORTUGUESE_COUNTRIES.has(cc)) return 'pt';
    if (FRENCH_COUNTRIES.has(cc)) return 'fr';
    if (ITALIAN_COUNTRIES.has(cc)) return 'it';
    // Otros países fuera de Hispanoamérica/Brasil/Francia/Italia (ej: US, GB, CA, AU, DE, JP) -> Inglés
    return 'en';
  }

  const lang = (acceptLanguage || '').toLowerCase();
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('it')) return 'it';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';

  return 'es';
}
