import { Artist, EphemerisItem, Interview, VideoItem, AgendaEvent, GenreType } from './types';
import { MOCK_ARTISTS, MOCK_EPHEMERIDES, MOCK_INTERVIEWS, MOCK_VIDEOS, MOCK_AGENDA } from './mockData';

// Data Service Layer
// Prepared for seamless transition to PocketBase or PostgreSQL/Prisma

export class MusicDataService {
  // Artists
  static async getArtists(filters?: { genre?: string; query?: string; featured?: boolean }): Promise<Artist[]> {
    let artists = [...MOCK_ARTISTS];

    if (filters?.featured !== undefined) {
      artists = artists.filter(a => a.featured === filters.featured);
    }

    if (filters?.genre) {
      artists = artists.filter(a =>
        a.genres.some(g => g.toLowerCase() === filters.genre?.toLowerCase())
      );
    }

    if (filters?.query) {
      const q = filters.query.toLowerCase();
      artists = artists.filter(a =>
        a.stageName.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.province.toLowerCase().includes(q) ||
        a.shortBio.toLowerCase().includes(q) ||
        a.genres.some(g => g.toLowerCase().includes(q))
      );
    }

    return artists;
  }

  static async getArtistBySlug(slug: string): Promise<Artist | null> {
    const artist = MOCK_ARTISTS.find(a => a.slug === slug);
    return artist || null;
  }

  static async getFeaturedArtistOfWeek(): Promise<Artist | null> {
    const artist = MOCK_ARTISTS.find(a => a.featuredOfWeek) || MOCK_ARTISTS[0];
    return artist || null;
  }

  // Videos
  static async getVideos(limit?: number): Promise<VideoItem[]> {
    const videos = [...MOCK_VIDEOS];
    if (limit) return videos.slice(0, limit);
    return videos;
  }

  // Interviews
  static async getInterviews(): Promise<Interview[]> {
    return [...MOCK_INTERVIEWS];
  }

  static async getInterviewBySlug(slug: string): Promise<Interview | null> {
    const item = MOCK_INTERVIEWS.find(i => i.slug === slug);
    return item || null;
  }

  static async getFeaturedInterview(): Promise<Interview | null> {
    const item = MOCK_INTERVIEWS.find(i => i.featured) || MOCK_INTERVIEWS[0];
    return item || null;
  }

  // Ephemerides
  static async getEphemeridesForDate(day: number, month: number): Promise<EphemerisItem[]> {
    return MOCK_EPHEMERIDES.filter(e => e.day === day && e.month === month);
  }

  static async getTodayEphemerides(): Promise<EphemerisItem[]> {
    const now = new Date();
    // Default to day 18, month 8 (Agosto) or current date
    const day = 18; // Default demo date matching soli.MD
    const month = 8;
    const items = await this.getEphemeridesForDate(day, month);
    return items.length > 0 ? items : MOCK_EPHEMERIDES.slice(0, 4);
  }

  static async getAllEphemerides(): Promise<EphemerisItem[]> {
    return [...MOCK_EPHEMERIDES];
  }

  // Agenda
  static async getUpcomingEvents(): Promise<AgendaEvent[]> {
    return [...MOCK_AGENDA];
  }

  // Genres List
  static getGenresList(): GenreType[] {
    return [
      'Folklore',
      'Rock',
      'Hip Hop',
      'Música Urbana',
      'Tango',
      'Música Popular',
      'Indie',
      'Fusión Latinoamericana',
      'Cumbia / Cuarteto',
      'Jazz / Instrumental'
    ];
  }
}
