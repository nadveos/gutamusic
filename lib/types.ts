// Data models and TypeScript types
// Designed to map 1:1 with PocketBase collections / Prisma schema

export type GenreType =
  | 'Folklore'
  | 'Rock'
  | 'Hip Hop'
  | 'Música Urbana'
  | 'Tango'
  | 'Música Popular'
  | 'Indie'
  | 'Fusión Latinoamericana'
  | 'Cumbia / Cuarteto'
  | 'Jazz / Instrumental';

export type VideoPlatform = 'youtube' | 'tiktok' | 'facebook';

export type VideoType = 'live' | 'interview' | 'acoustic' | 'clip' | 'session';

export type EphemerisCategory =
  | 'lanzamientos'
  | 'billboard'
  | 'sadaic'
  | 'cosquin'
  | 'jesus_maria'
  | 'gardel'
  | 'internacional'
  | 'fallecimientos'
  | 'nacimientos'
  | 'homenajes'
  | 'curiosidades'
  // LATAM
  | 'latam_mexico'
  | 'latam_colombia'
  | 'latam_chile'
  | 'latam_peru'
  | 'latam_venezuela'
  | 'latam_bolivia'
  | 'latam_ecuador'
  | 'latam_uruguay'
  | 'latam_paraguay'
  | 'latam_brasil'
  | 'latam_centroamerica'
  | 'latam_caribe'
  | 'latam_festivales'
  | 'latam_premios';

export type DiscographyType = 'single' | 'ep' | 'album' | 'live_album';

export interface SocialLinks {
  spotify?: string;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  twitter?: string;
  bandcamp?: string;
  website?: string;
}

export interface DiscographyItem {
  id: string;
  title: string;
  type: DiscographyType;
  year: number;
  coverUrl: string;
  spotifyUrl?: string;
  tracksCount?: number;
  releaseDate?: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  venue: string;
  city: string;
  province: string;
  country: string;
  date: string; // ISO string or YYYY-MM-DD HH:mm
  ticketUrl?: string;
  ticketPrice?: string;
  isFree?: boolean;
  type: 'recital' | 'festival' | 'pena' | 'acustico' | 'feria';
}

export interface VideoItem {
  id: string;
  title: string;
  platform: VideoPlatform;
  url: string;
  embedUrl?: string;
  thumbnailUrl: string;
  channelOrAuthor: string;
  type: VideoType;
  duration?: string;
  publishedAt: string;
  views?: string;
  featured?: boolean;
  artistId?: string;
  artistName?: string;
}

export interface PressNote {
  id: string;
  title: string;
  medium: string;
  date: string;
  url?: string;
  excerpt: string;
}

export interface Artist {
  id: string;
  slug: string;
  stageName: string;
  realName?: string;
  genres: GenreType[];
  city: string;
  province: string;
  country: string;
  bio: string;
  shortBio: string;
  photoUrl: string;
  bannerUrl: string;
  featured: boolean;
  featuredOfWeek?: boolean;
  socials: SocialLinks;
  videos: VideoItem[];
  discography: DiscographyItem[];
  agenda: AgendaEvent[];
  press: PressNote[];
  gallery: string[];
  quotes?: string;
  createdDate: string;
  likesCount?: number;
}

export interface Interview {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  artistId: string;
  artistName: string;
  artistSlug: string;
  artistPhoto: string;
  host: string;
  date: string;
  summary: string;
  editorialText: string;
  keyHighlights: string[];
  videoUrl: string;
  videoPlatform: VideoPlatform;
  thumbnailUrl: string;
  featured?: boolean;
  category: 'Estudio' | 'En Vivo' | 'Acústico GUTA' | 'Especial';
}

export interface EphemerisItem {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  description: string;
  category: EphemerisCategory;
  categoryLabel: string;
  source?: string;
  imageUrl?: string;
  artistRelated?: string;
  impactBadge?: string;
  mbid?: string;
  country?: string;
  originCity?: string;
  ipi?: string;
}

export type AllianceSector =
  | 'global_footer'   // Recomendado: Visible en todas las secciones antes del footer
  | 'home_mid'        // Visible en la portada principal
  | 'artistas_catalog'// Visible en el catálogo de artistas
  | 'agenda_events'   // Visible en la cartelera de eventos
  | 'all_sections';   // Multisección transversal

export interface AlliancePartner {
  id: string;
  name: string;
  category?: string;       // e.g. "Equipamiento de Audio", "Luthier & Instrumentos", "Estudio de Grabación"
  imageUrl: string;        // URL de imagen/logo (adaptativo a cualquier alto/ancho)
  phone?: string;          // Teléfono para llamadas directas
  whatsapp?: string;       // Número limpio para enlace wa.me directo
  websiteUrl?: string;     // Sitio web o red social
  email?: string;          // Email de contacto
  sector: AllianceSector;  // Sector asignado en la web
  active: boolean;         // Estado de publicación (activo/pausado)
  priority?: number;       // Orden de visualización (1, 2, 3...)
  description?: string;    // Breve reseña o eslogan institucional
  createdDate?: string;
}

