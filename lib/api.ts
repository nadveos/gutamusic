import { Artist, EphemerisItem, Interview, VideoItem, AgendaEvent, GenreType } from './types';
import { MOCK_ARTISTS, MOCK_EPHEMERIDES, MOCK_INTERVIEWS, MOCK_VIDEOS, MOCK_AGENDA } from './mockData';
import { pb } from './pocketbase';

// Music Data Service
// Connects to PocketBase (https://gutamusic.meapp.com.ar) with fallback to MockData

export class MusicDataService {
  // ARTISTS
  static async getArtists(filters?: { genre?: string; query?: string; featured?: boolean }): Promise<Artist[]> {
    try {
      // Try to load from PocketBase collection 'artists'
      const records = await pb.collection('artists').getFullList<any>({
        sort: '-created',
        requestKey: null,
      });

      if (records && records.length > 0) {
        let artists: Artist[] = records.map((r) => ({
          id: r.id,
          slug: r.slug,
          stageName: r.stageName,
          realName: r.realName,
          genres: Array.isArray(r.genres) ? r.genres : [r.genres],
          city: r.city,
          province: r.province,
          country: r.country || 'Argentina',
          bio: r.bio,
          shortBio: r.shortBio,
          photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop'),
          bannerUrl: r.bannerUrl || '',
          featured: Boolean(r.featured),
          featuredOfWeek: Boolean(r.featuredOfWeek),
          socials: r.socials || {},
          videos: r.videos || [],
          discography: r.discography || [],
          agenda: r.agenda || [],
          press: r.press || [],
          gallery: r.gallery || [],
          quotes: r.quotes || '',
          createdDate: r.createdDate || r.created?.split(' ')[0] || '2026-08-18',
        }));

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
            a.province.toLowerCase().includes(q)
          );
        }
        return artists;
      }
    } catch (err) {
      // Fallback to Mock Data
    }

    // Default Mock Fallback
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
    try {
      const record = await pb.collection('artists').getFirstListItem(`slug="${slug}"`, {
        requestKey: null,
      });
      if (record) {
        return {
          id: record.id,
          slug: record.slug,
          stageName: record.stageName,
          realName: record.realName,
          genres: Array.isArray(record.genres) ? record.genres : [record.genres],
          city: record.city,
          province: record.province,
          country: record.country || 'Argentina',
          bio: record.bio,
          shortBio: record.shortBio,
          photoUrl: record.photoUrl || (record.photo ? pb.files.getUrl(record, record.photo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop'),
          bannerUrl: record.bannerUrl || '',
          featured: Boolean(record.featured),
          featuredOfWeek: Boolean(record.featuredOfWeek),
          socials: record.socials || {},
          videos: record.videos || [],
          discography: record.discography || [],
          agenda: record.agenda || [],
          press: record.press || [],
          gallery: record.gallery || [],
          quotes: record.quotes || '',
          createdDate: record.createdDate || record.created?.split(' ')[0] || '2026-08-18',
        };
      }
    } catch (e) {}

    const artist = MOCK_ARTISTS.find(a => a.slug === slug);
    return artist || null;
  }

  static async getFeaturedArtistOfWeek(): Promise<Artist | null> {
    try {
      const record = await pb.collection('artists').getFirstListItem('featuredOfWeek=true', {
        requestKey: null,
      });
      if (record) return this.getArtistBySlug(record.slug);
    } catch (e) {}

    const artist = MOCK_ARTISTS.find(a => a.featuredOfWeek) || MOCK_ARTISTS[0];
    return artist || null;
  }

  // VIDEOS
  static async getVideos(limit?: number): Promise<VideoItem[]> {
    try {
      const records = await pb.collection('videos').getFullList<any>({
        sort: '-publishedAt',
        requestKey: null,
      });
      if (records && records.length > 0) {
        const list: VideoItem[] = records.map((r) => ({
          id: r.id,
          title: r.title,
          platform: r.platform,
          url: r.url,
          embedUrl: r.embedUrl,
          thumbnailUrl: r.thumbnailUrl,
          channelOrAuthor: r.channelOrAuthor,
          type: r.type,
          duration: r.duration,
          publishedAt: r.publishedAt,
          views: r.views,
          featured: Boolean(r.featured),
          artistId: r.artistId,
          artistName: r.artistName,
        }));
        return limit ? list.slice(0, limit) : list;
      }
    } catch (e) {}

    const videos = [...MOCK_VIDEOS];
    return limit ? videos.slice(0, limit) : videos;
  }

  // INTERVIEWS
  static async getInterviews(): Promise<Interview[]> {
    try {
      const records = await pb.collection('interviews').getFullList<any>({
        sort: '-created',
        requestKey: null,
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          subtitle: r.subtitle,
          artistId: r.artistId,
          artistName: r.artistName,
          artistSlug: r.artistSlug,
          artistPhoto: r.artistPhoto,
          host: r.host,
          date: r.date,
          summary: r.summary,
          editorialText: r.editorialText,
          keyHighlights: Array.isArray(r.keyHighlights) ? r.keyHighlights : [],
          videoUrl: r.videoUrl,
          videoPlatform: r.videoPlatform,
          thumbnailUrl: r.thumbnailUrl,
          featured: Boolean(r.featured),
          category: r.category,
        }));
      }
    } catch (e) {}

    return [...MOCK_INTERVIEWS];
  }

  static async getInterviewBySlug(slug: string): Promise<Interview | null> {
    try {
      const record = await pb.collection('interviews').getFirstListItem(`slug="${slug}"`, {
        requestKey: null,
      });
      if (record) {
        return {
          id: record.id,
          slug: record.slug,
          title: record.title,
          subtitle: record.subtitle,
          artistId: record.artistId,
          artistName: record.artistName,
          artistSlug: record.artistSlug,
          artistPhoto: record.artistPhoto,
          host: record.host,
          date: record.date,
          summary: record.summary,
          editorialText: record.editorialText,
          keyHighlights: Array.isArray(record.keyHighlights) ? record.keyHighlights : [],
          videoUrl: record.videoUrl,
          videoPlatform: record.videoPlatform,
          thumbnailUrl: record.thumbnailUrl,
          featured: Boolean(record.featured),
          category: record.category,
        };
      }
    } catch (e) {}

    const item = MOCK_INTERVIEWS.find(i => i.slug === slug);
    return item || null;
  }

  static async getFeaturedInterview(): Promise<Interview | null> {
    const interviews = await this.getInterviews();
    return interviews.find(i => i.featured) || interviews[0] || null;
  }

  // EPHEMERIDES
  static async getEphemeridesForDate(day: number, month: number): Promise<EphemerisItem[]> {
    try {
      const records = await pb.collection('ephemerides').getFullList<any>({
        filter: `day=${day} && month=${month}`,
        sort: 'year',
        requestKey: null,
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          day: r.day,
          month: r.month,
          year: r.year,
          title: r.title,
          description: r.description,
          category: r.category,
          categoryLabel: r.categoryLabel,
          source: r.source,
          imageUrl: r.imageUrl,
          artistRelated: r.artistRelated,
          impactBadge: r.impactBadge,
        }));
      }
    } catch (e) {}

    return MOCK_EPHEMERIDES.filter(e => e.day === day && e.month === month);
  }

  static async getTodayEphemerides(): Promise<EphemerisItem[]> {
    const day = 18;
    const month = 8;
    const items = await this.getEphemeridesForDate(day, month);
    return items.length > 0 ? items : MOCK_EPHEMERIDES.slice(0, 4);
  }

  static async getAllEphemerides(): Promise<EphemerisItem[]> {
    try {
      const records = await pb.collection('ephemerides').getFullList<any>({
        sort: 'month,day',
        requestKey: null,
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          day: r.day,
          month: r.month,
          year: r.year,
          title: r.title,
          description: r.description,
          category: r.category,
          categoryLabel: r.categoryLabel,
          source: r.source,
          imageUrl: r.imageUrl,
          artistRelated: r.artistRelated,
          impactBadge: r.impactBadge,
        }));
      }
    } catch (e) {}

    return [...MOCK_EPHEMERIDES];
  }

  // AGENDA
  static async getUpcomingEvents(): Promise<AgendaEvent[]> {
    try {
      const records = await pb.collection('events').getFullList<any>({
        sort: 'date',
        requestKey: null,
      });
      if (records && records.length > 0) {
        return records.map((r) => ({
          id: r.id,
          title: r.title,
          venue: r.venue,
          city: r.city,
          province: r.province,
          country: r.country || 'Argentina',
          date: r.date,
          ticketUrl: r.ticketUrl,
          ticketPrice: r.ticketPrice,
          isFree: Boolean(r.isFree),
          type: r.type,
        }));
      }
    } catch (e) {}

    return [...MOCK_AGENDA];
  }

  // GENRES
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
