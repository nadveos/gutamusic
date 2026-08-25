import { Artist, EphemerisItem, Interview, VideoItem, AgendaEvent, GenreType, PressNote } from './types';
import { pb, ensureServerSuperUserAuth } from './pocketbase';

async function syncServerAuth() {
  if (typeof window === 'undefined') {
    // 1. Intentar cargar sesión desde cookies de la petición
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        pb.authStore.loadFromCookie(cookieHeader);
      }
    } catch {
      // outside request context
    }

    // 2. Si no hay token de cookie, autenticar automáticamente con PB_EMAIL y PB_PASSWORD
    if (!pb.authStore.isValid) {
      await ensureServerSuperUserAuth();
    }
  }
}

// Music Data Service
// Connects exclusively to PocketBase (https://gutamusic.meapp.com.ar) without mock fallbacks

export class MusicDataService {
  // ARTISTS
  static async getArtists(filters?: { genre?: string; query?: string; featured?: boolean }): Promise<Artist[]> {
    try {
      await syncServerAuth();
      // Load directly from PocketBase collection 'artists'
      const records = await pb.collection('artists').getFullList<any>({
        requestKey: null,
      });

      if (records && records.length > 0) {
        let artists: Artist[] = records.map((r) => ({
          id: r.id,
          slug: r.slug,
          stageName: r.stageName,
          realName: r.realName || '',
          genres: Array.isArray(r.genres) ? r.genres : (r.genres ? [r.genres] : []),
          city: r.city || '',
          province: r.province || '',
          country: r.country || 'Argentina',
          bio: r.bio || '',
          shortBio: r.shortBio || '',
          photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : ''),
          bannerUrl: r.bannerUrl || '',
          featured: Boolean(r.featured),
          featuredOfWeek: Boolean(r.featuredOfWeek),
          socials: r.socials || {},
          videos: r.videos || [],
          discography: r.discography || [],
          agenda: r.agenda || [],
          press: r.press || [],
          gallery: Array.isArray(r.gallery) ? r.gallery : (typeof r.gallery === 'string' && r.gallery ? [r.gallery] : []),
          quotes: r.quotes || '',
          createdDate: r.createdDate || r.created?.split(' ')[0] || '',
          likesCount: typeof r.likesCount === 'number' ? r.likesCount : (parseInt(r.likesCount, 10) || 0),
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
            a.province.toLowerCase().includes(q) ||
            a.shortBio.toLowerCase().includes(q) ||
            a.genres.some(g => g.toLowerCase().includes(q))
          );
        }
        return artists;
      }
    } catch (err) {
      console.error('Error fetching artists from PocketBase:', err);
    }

    return [];
  }

  static async getArtistBySlug(slug: string): Promise<Artist | null> {
    try {
      await syncServerAuth();
      let record: any = null;
      try {
        record = await pb.collection('artists').getFirstListItem(`slug="${slug}"`, {
          requestKey: null,
        });
      } catch {
        // Fallback search by ID if slug is ID
        try {
          record = await pb.collection('artists').getOne(slug, { requestKey: null });
        } catch {}
      }

      if (record) {
        const artistAgenda: AgendaEvent[] = Array.isArray(record.agenda) ? record.agenda : [];
        try {
          const matchingEvents = await pb.collection('events').getFullList<any>({
            sort: 'date',
            requestKey: null,
          });
          if (matchingEvents && matchingEvents.length > 0) {
            const existingIds = new Set(artistAgenda.map(e => e.id));
            const stageNameLower = (record.stageName || '').toLowerCase().trim();
            for (const me of matchingEvents) {
              if (!existingIds.has(me.id) && me.title && me.title.toLowerCase().includes(stageNameLower)) {
                artistAgenda.push({
                  id: me.id,
                  title: me.title,
                  venue: me.venue || 'Teatro / Espacio Cultural',
                  city: me.city || record.city || '',
                  province: me.province || record.province || '',
                  country: me.country || 'Argentina',
                  date: me.date || '2026-09-01',
                  ticketUrl: me.ticketUrl || '',
                  ticketPrice: me.ticketPrice || '',
                  isFree: Boolean(me.isFree),
                  type: me.type || 'recital',
                });
              }
            }
          }
        } catch (e) {}

        const artistVideos: VideoItem[] = Array.isArray(record.videos) ? [...record.videos] : [];
        try {
          const allVideos = await this.getVideos();
          if (allVideos && allVideos.length > 0) {
            const existingIds = new Set(artistVideos.map((v) => v.id));
            const stageNameLower = (record.stageName || '').toLowerCase().trim();
            const artistId = record.id;
            const artistSlug = record.slug;

            for (const mv of allVideos) {
              const mvArtistName = (mv.artistName || '').toLowerCase().trim();
              const matchesArtist =
                (mv.artistId && (mv.artistId === artistId || mv.artistId === artistSlug)) ||
                (mvArtistName && stageNameLower && (
                  mvArtistName === stageNameLower ||
                  mvArtistName.includes(stageNameLower) ||
                  stageNameLower.includes(mvArtistName)
                ));

              if (matchesArtist && !existingIds.has(mv.id)) {
                artistVideos.push(mv);
              }
            }
          }
        } catch (e) {
          console.error('Error fetching matching videos for artist:', e);
        }

        const artistPress: PressNote[] = Array.isArray(record.press) ? [...record.press] : [];
        try {
          const allInterviews = await this.getInterviews();
          if (allInterviews && allInterviews.length > 0) {
            const existingPressTitles = new Set(artistPress.map((p) => (p.title || '').toLowerCase().trim()));
            const existingPressIds = new Set(artistPress.map((p) => p.id));
            const stageNameLower = (record.stageName || '').toLowerCase().trim();
            const artistId = record.id;
            const artistSlug = record.slug;

            for (const mi of allInterviews) {
              const miArtistName = (mi.artistName || '').toLowerCase().trim();
              const matchesArtist =
                (mi.artistId && (mi.artistId === artistId || mi.artistId === artistSlug)) ||
                (mi.artistSlug && (mi.artistSlug === artistSlug || mi.artistSlug === artistId)) ||
                (miArtistName && stageNameLower && (
                  miArtistName === stageNameLower ||
                  miArtistName.includes(stageNameLower) ||
                  stageNameLower.includes(miArtistName)
                ));

              if (matchesArtist && !existingPressIds.has(mi.id) && !existingPressTitles.has((mi.title || '').toLowerCase().trim())) {
                artistPress.push({
                  id: mi.id,
                  title: mi.title,
                  medium: `GUTA MÚSICA — Editorial (${mi.category || 'Entrevista'})`,
                  date: mi.date,
                  url: `/entrevistas/${mi.slug}`,
                  excerpt: mi.summary || mi.subtitle || 'Entrevista y cobertura editorial exclusiva en GUTA MÚSICA.',
                });
              }

              // Si la entrevista incluye video propio, integrarlo también en Videos & Lives del artista si no estaba
              if (matchesArtist && mi.videoUrl) {
                const existingVideoUrls = new Set(artistVideos.map((v) => (v.url || '').trim()));
                const existingVideoTitles = new Set(artistVideos.map((v) => (v.title || '').toLowerCase().trim()));
                if (!existingVideoUrls.has(mi.videoUrl.trim()) && !existingVideoTitles.has((mi.title || '').toLowerCase().trim())) {
                  artistVideos.push({
                    id: `interview-vid-${mi.id}`,
                    title: mi.title,
                    platform: mi.videoPlatform || 'youtube',
                    url: mi.videoUrl,
                    embedUrl: mi.videoUrl,
                    thumbnailUrl: mi.thumbnailUrl || mi.artistPhoto || record.photoUrl || '',
                    channelOrAuthor: `GUTA MÚSICA (${mi.host || 'Editorial'})`,
                    type: 'interview',
                    duration: '',
                    publishedAt: mi.date || '',
                    views: '1K',
                    featured: Boolean(mi.featured),
                    artistId: record.id,
                    artistName: record.stageName,
                  });
                }
              }
            }
          }
        } catch (e) {
          console.error('Error fetching matching interviews for artist:', e);
        }

        return {
          id: record.id,
          slug: record.slug,
          stageName: record.stageName,
          realName: record.realName || '',
          genres: Array.isArray(record.genres) ? record.genres : (record.genres ? [record.genres] : []),
          city: record.city || '',
          province: record.province || '',
          country: record.country || 'Argentina',
          bio: record.bio || '',
          shortBio: record.shortBio || '',
          photoUrl: record.photoUrl || (record.photo ? pb.files.getUrl(record, record.photo) : ''),
          bannerUrl: record.bannerUrl || '',
          featured: Boolean(record.featured),
          featuredOfWeek: Boolean(record.featuredOfWeek),
          socials: record.socials || {},
          videos: artistVideos,
          discography: record.discography || [],
          agenda: artistAgenda,
          press: artistPress,
          gallery: Array.isArray(record.gallery) ? record.gallery : (typeof record.gallery === 'string' && record.gallery ? [record.gallery] : []),
          quotes: record.quotes || '',
          createdDate: record.createdDate || record.created?.split(' ')[0] || '',
          likesCount: typeof record.likesCount === 'number' ? record.likesCount : (parseInt(record.likesCount, 10) || 0),
        };
      }
    } catch (e) {
      console.error('Error fetching artist by slug:', e);
    }

    return null;
  }

  static async getFeaturedArtists(): Promise<Artist[]> {
    try {
      await syncServerAuth();
      const records = await pb.collection('artists').getFullList<any>({
        requestKey: null,
      });

      if (records && records.length > 0) {
        let featuredRecords = records.filter(
          (r) => Boolean(r.featuredOfWeek) || Boolean(r.featured)
        );

        // Ordenar: primero featuredOfWeek, luego featured
        featuredRecords.sort((a, b) => {
          if (a.featuredOfWeek && !b.featuredOfWeek) return -1;
          if (!a.featuredOfWeek && b.featuredOfWeek) return 1;
          return 0;
        });

        // Fallback al primer artista si ninguno está tildado como destacado
        if (featuredRecords.length === 0) {
          featuredRecords = [records[0]];
        }

        const results = await Promise.all(
          featuredRecords.map((r) => this.getArtistBySlug(r.slug))
        );
        return results.filter((a): a is Artist => a !== null);
      }
    } catch (e) {
      console.error('Error fetching featured artists list:', e);
    }

    return [];
  }

  static async getFeaturedArtistOfWeek(): Promise<Artist | null> {
    const list = await this.getFeaturedArtists();
    return list[0] || null;
  }

  // VIDEOS
  static async getVideos(limit?: number): Promise<VideoItem[]> {
    try {
      await syncServerAuth();
      let records: any[] = [];
      try {
        records = await pb.collection('videos').getFullList<any>({
          requestKey: null,
        });
      } catch (e) {
        console.error('Error fetching videos collection from PocketBase:', e);
      }

      if (records && records.length > 0) {
        const list: VideoItem[] = records.map((r) => ({
          id: r.id,
          title: r.title,
          platform: r.platform || 'youtube',
          url: r.url,
          embedUrl: r.embedUrl,
          thumbnailUrl: r.thumbnailUrl,
          channelOrAuthor: r.channelOrAuthor || '',
          type: r.type || 'session',
          duration: r.duration || '',
          publishedAt: r.publishedAt || r.created?.split(' ')[0] || '',
          views: r.views || '1K',
          featured: Boolean(r.featured),
          artistId: r.artistId || '',
          artistName: r.artistName || '',
        }));
        return limit ? list.slice(0, limit) : list;
      }
    } catch (e) {}

    return [];
  }

  // INTERVIEWS
  static async getInterviews(): Promise<Interview[]> {
    try {
      await syncServerAuth();
      const records = await pb.collection('interviews').getFullList<any>({
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

    return [];
  }

  static async getInterviewBySlug(slug: string): Promise<Interview | null> {
    try {
      await syncServerAuth();
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

    return null;
  }

  static async getFeaturedInterview(): Promise<Interview | null> {
    const interviews = await this.getInterviews();
    return interviews.find(i => i.featured) || interviews[0] || null;
  }

  // EPHEMERIDES
  static async getEphemeridesForDate(day: number, month: number): Promise<EphemerisItem[]> {
    try {
      await syncServerAuth();
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

    return [];
  }

  static async getTodayEphemerides(day?: number, month?: number): Promise<EphemerisItem[]> {
    const now = new Date();
    const currentDay = day ?? now.getDate();
    const currentMonth = month ?? (now.getMonth() + 1);
    const items = await this.getEphemeridesForDate(currentDay, currentMonth);
    if (items.length > 0) return items;
    const all = await this.getAllEphemerides();
    return all.slice(0, 4);
  }

  static async getAllEphemerides(): Promise<EphemerisItem[]> {
    try {
      await syncServerAuth();
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

    return [];
  }

  // AGENDA
  static async getUpcomingEvents(): Promise<AgendaEvent[]> {
    try {
      await syncServerAuth();
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

    return [];
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
