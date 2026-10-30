import { Artist, EphemerisItem, Interview, VideoItem, AgendaEvent, GenreType, PressNote, AlliancePartner, AllianceSector, OfficialSocialsSettings } from './types';
import { DEFAULT_OFFICIAL_SOCIALS, buildSocialUrl } from './socialUtils';
import { getRealEphemerides } from './services/ephemeridesScraper';
import { getWeeklyFeaturedStatus } from './services/featuredRotationService';
import { pb, ensureServerSuperUserAuth, getServerAdminPb } from './pocketbase';

const syncingEphemeridesMap = new Map<string, Promise<EphemerisItem[]>>();

export function getArgentinaDayMonth(): { day: number; month: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      day: 'numeric',
      month: 'numeric',
    }).formatToParts(new Date());
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return { day, month };
    }
  } catch {}
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1 };
}

function normalizeImageUrl(raw?: any, fallback: string = ''): string {
  if (!raw || typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return fallback;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (/^[\w.-]+\.[a-z]{2,}\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return fallback;
}

async function syncServerAuth() {
  if (typeof window === 'undefined') {
    await ensureServerSuperUserAuth();
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
        // Invertir lista para mostrar primero los artistas más recientes
        // y excluir perfiles que se encuentren en revisión o rechazados
        const visibleRecords = records
          .filter((r) => !r.status || r.status === 'approved')
          .reverse();

        let artists: Artist[] = visibleRecords.map((r) => ({
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
          photoUrl: normalizeImageUrl(r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : ''), '/brand/guta-musica-favicon-512.png'),
          bannerUrl: normalizeImageUrl(r.bannerUrl, ''),
          featured: Boolean(r.featured),
          featuredOfWeek: Boolean(r.featuredOfWeek),
          featuredOfWeekDate: r.featuredOfWeekDate || '',
          socials: r.socials || {},
          videos: Array.isArray(r.videos)
            ? r.videos.map((v: any) => ({
                ...v,
                thumbnailUrl: normalizeImageUrl(v?.thumbnailUrl, '/brand/guta-musica-logo.png'),
              }))
            : [],
          discography: Array.isArray(r.discography)
            ? r.discography.map((d: any) => ({
                ...d,
                coverUrl: normalizeImageUrl(d?.coverUrl, ''),
              }))
            : [],
          agenda: r.agenda || [],
          press: r.press || [],
          gallery: (Array.isArray(r.gallery) ? r.gallery : (typeof r.gallery === 'string' && r.gallery ? [r.gallery] : []))
            .map((img: any) => normalizeImageUrl(img, ''))
            .filter(Boolean),
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
          photoUrl: normalizeImageUrl(record.photoUrl || (record.photo ? pb.files.getUrl(record, record.photo) : ''), '/brand/guta-musica-favicon-512.png'),
          bannerUrl: normalizeImageUrl(record.bannerUrl, ''),
          featured: Boolean(record.featured),
          featuredOfWeek: Boolean(record.featuredOfWeek),
          socials: record.socials || {},
          videos: artistVideos.map((v) => ({
            ...v,
            thumbnailUrl: normalizeImageUrl(v?.thumbnailUrl, '/brand/guta-musica-logo.png'),
          })),
          discography: Array.isArray(record.discography)
            ? record.discography.map((d: any) => ({
                ...d,
                coverUrl: normalizeImageUrl(d?.coverUrl, ''),
              }))
            : [],
          agenda: artistAgenda,
          press: artistPress,
          gallery: (Array.isArray(record.gallery) ? record.gallery : (typeof record.gallery === 'string' && record.gallery ? [record.gallery] : []))
            .map((img: any) => normalizeImageUrl(img, ''))
            .filter(Boolean),
          quotes: record.quotes || '',
          createdDate: record.createdDate || record.created?.split(' ')[0] || '',
          likesCount: typeof record.likesCount === 'number' ? record.likesCount : (parseInt(record.likesCount, 10) || 0),
          monthlyListeners: record.monthlyListeners || '',
        };
      }
    } catch (e) {
      console.error('Error fetching artist by slug:', e);
    }

    return null;
  }

  // CONSAGRADOS (Artistas destacados fijos/permanentes para el Hero Principal)
  static async getConsagradosArtists(): Promise<Artist[]> {
    try {
      await syncServerAuth();
      const records = await pb.collection('artists').getFullList<any>({
        requestKey: null,
      });

      if (records && records.length > 0) {
        const approved = records.filter((r) => !r.status || r.status === 'approved').reverse();
        // Filtrar los que tienen featured = true (Consagrados fijos)
        let consagrados = approved.filter((r) => Boolean(r.featured));

        // Si aún no se marcaron consagrados explícitos, usar los destacados o más recientes como fallback
        if (consagrados.length === 0) {
          consagrados = approved.filter((r) => Boolean(r.featuredOfWeek));
        }
        if (consagrados.length === 0) {
          consagrados = approved.slice(0, 3);
        }

        const results = await Promise.all(
          consagrados.map((r) => this.getArtistBySlug(r.slug))
        );
        return results.filter((a): a is Artist => a !== null);
      }
    } catch (e) {
      console.error('Error fetching consagrados artists:', e);
    }
    return [];
  }

  // DESTACADOS DE LA SEMANA (Selección rotativa de 7 días para la sección de cards)
  static async getWeeklyFeaturedArtists(): Promise<Artist[]> {
    try {
      await syncServerAuth();
      const records = await pb.collection('artists').getFullList<any>({
        requestKey: null,
      });

      if (records && records.length > 0) {
        const approved = records.filter((r) => !r.status || r.status === 'approved').reverse();

        const weeklyRecords = approved.filter((r) => {
          if (r.featuredOfWeek) {
            const status = getWeeklyFeaturedStatus(r.featuredOfWeekDate);
            if (status.isExpired) {
              pb.collection('artists')
                .update(r.id, { featuredOfWeek: false, featuredOfWeekDate: '' })
                .catch(() => {});
              return false;
            }
            return true;
          }
          return false;
        });

        const results = await Promise.all(
          weeklyRecords.map((r) => this.getArtistBySlug(r.slug))
        );
        return results.filter((a): a is Artist => a !== null);
      }
    } catch (e) {
      console.error('Error fetching weekly featured artists:', e);
    }
    return [];
  }

  static async getFeaturedArtists(): Promise<Artist[]> {
    return this.getConsagradosArtists();
  }

  static async getFeaturedArtistOfWeek(): Promise<Artist | null> {
    const list = await this.getWeeklyFeaturedArtists();
    if (list.length > 0) return list[0];
    const consagrados = await this.getConsagradosArtists();
    return consagrados[0] || null;
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
          thumbnailUrl: normalizeImageUrl(r.thumbnailUrl, '/brand/guta-musica-logo.png'),
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
        const parseInterviewTimestamp = (dateStr?: string, createdStr?: string): number => {
          if (dateStr) {
            const direct = Date.parse(dateStr);
            if (!isNaN(direct)) return direct;

            // Parsear fechas en español del tipo "21 de agosto de 2026"
            const monthsEs: Record<string, number> = {
              enero: 0,
              febrero: 1,
              marzo: 2,
              abril: 3,
              mayo: 4,
              junio: 5,
              julio: 6,
              agosto: 7,
              septiembre: 8,
              setiembre: 8,
              octubre: 9,
              noviembre: 10,
              diciembre: 11,
            };
            const match = dateStr
              .toLowerCase()
              .match(/(\d{1,2})\s+de\s+([a-záéíóú]+)\s+(?:de\s+)?(\d{4})/);
            if (match) {
              const day = parseInt(match[1], 10);
              const month = monthsEs[match[2]];
              const year = parseInt(match[3], 10);
              if (month !== undefined) {
                return new Date(year, month, day).getTime();
              }
            }
          }
          if (createdStr) {
            const fallback = Date.parse(createdStr);
            if (!isNaN(fallback)) return fallback;
          }
          return 0;
        };

        const getPriorityGroup = (item: Interview): number => {
          const haystack = `${item.artistName || ''} ${item.title || ''} ${item.slug || ''}`.toLowerCase();
          if (haystack.includes('tupay')) return 1;
          if (haystack.includes('cecilia camacho') || haystack.includes('ceci camacho')) return 2;
          if (item.featured) return 3;
          return 4;
        };

        const mapped: (Interview & { _ts: number })[] = records.map((r) => {
          const haystack = `${r.artistName || ''} ${r.title || ''} ${r.slug || ''}`.toLowerCase();
          const isPinnedFeatured =
            Boolean(r.featured) ||
            haystack.includes('tupay') ||
            haystack.includes('cecilia camacho') ||
            haystack.includes('ceci camacho');

          return {
            id: r.id,
            slug: r.slug,
            title: r.title,
            subtitle: r.subtitle,
            artistId: r.artistId,
            artistName: r.artistName,
            artistSlug: r.artistSlug,
            artistPhoto: normalizeImageUrl(r.artistPhoto, '/brand/guta-musica-favicon-512.png'),
            host: r.host,
            date: r.date,
            summary: r.summary,
            editorialText: r.editorialText,
            keyHighlights: Array.isArray(r.keyHighlights) ? r.keyHighlights : [],
            videoUrl: r.videoUrl,
            videoPlatform: r.videoPlatform,
            thumbnailUrl: normalizeImageUrl(r.thumbnailUrl || r.artistPhoto, '/brand/guta-musica-logo.png'),
            featured: isPinnedFeatured,
            category: r.category,
            _ts: parseInterviewTimestamp(r.date, r.created),
          };
        });

        mapped.sort((a, b) => {
          const prioA = getPriorityGroup(a);
          const prioB = getPriorityGroup(b);
          if (prioA !== prioB) return prioA - prioB;
          return b._ts - a._ts;
        });

        return mapped.map(({ _ts, ...rest }) => rest);
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
          artistPhoto: normalizeImageUrl(record.artistPhoto, '/brand/guta-musica-favicon-512.png'),
          host: record.host,
          date: record.date,
          summary: record.summary,
          editorialText: record.editorialText,
          keyHighlights: Array.isArray(record.keyHighlights) ? record.keyHighlights : [],
          videoUrl: record.videoUrl,
          videoPlatform: record.videoPlatform,
          thumbnailUrl: normalizeImageUrl(record.thumbnailUrl || record.artistPhoto, '/brand/guta-musica-logo.png'),
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
          imageUrl: normalizeImageUrl(r.imageUrl, ''),
          artistRelated: r.artistRelated,
          impactBadge: r.impactBadge,
        }));
      }
    } catch (e) {}

    return [];
  }

  static async getTodayEphemerides(day?: number, month?: number): Promise<EphemerisItem[]> {
    await syncServerAuth();
    const argNow = getArgentinaDayMonth();
    const currentDay = day ?? argNow.day;
    const currentMonth = month ?? argNow.month;

    // 1. Intentar leer desde PocketBase
    const items = await this.getEphemeridesForDate(currentDay, currentMonth);
    if (items.length > 0) return items;

    const dateKey = `${currentDay}-${currentMonth}`;
    const existingSync = syncingEphemeridesMap.get(dateKey);
    if (existingSync) {
      return existingSync;
    }

    // 2. Si no hay registros para esa fecha, raspar las fuentes automáticamente
    //    y persistir en PocketBase para que las siguientes visitas no vuelvan a raspar.
    const syncPromise = (async (): Promise<EphemerisItem[]> => {
      console.log(`[AutoSync] No hay efemérides para ${currentDay}/${currentMonth} en PocketBase. Raspando fuentes...`);
      try {
        const scraped = await getRealEphemerides(currentDay, currentMonth);
        if (scraped.length > 0) {
          // Verificar una vez más antes de insertar por si otro proceso ya guardó
          const doubleCheck = await this.getEphemeridesForDate(currentDay, currentMonth);
          if (doubleCheck.length > 0) return doubleCheck;

          const adminPb = await getServerAdminPb();
          const saved: EphemerisItem[] = [];
          const batchSize = 10;

          for (let i = 0; i < scraped.length; i += batchSize) {
            const chunk = scraped.slice(i, i + batchSize);
            const chunkResults = await Promise.all(
              chunk.map(async (s, idx) => {
                const payload = {
                  day: s.day,
                  month: s.month,
                  year: s.year,
                  title: s.title,
                  description: s.description,
                  category: s.category as any,
                  categoryLabel: s.categoryLabel,
                  source: s.source,
                  impactBadge: s.impactBadge,
                  imageUrl: normalizeImageUrl(s.imageUrl, ''),
                };
                try {
                  const created = await adminPb.collection('ephemerides').create(payload, {
                    requestKey: null,
                  });
                  return { ...payload, id: created.id } as EphemerisItem;
                } catch (e: any) {
                  console.warn('[AutoSync] Error guardando efeméride en PocketBase:', e?.message);
                  return {
                    ...payload,
                    id: `tmp-${s.year}-${s.day}-${s.month}-${i + idx}`,
                  } as EphemerisItem;
                }
              })
            );
            saved.push(...chunkResults);
          }

          console.log(`[AutoSync] ✅ ${saved.length} efemérides raspadas y guardadas para ${currentDay}/${currentMonth}.`);
          return saved;
        }
      } catch (e: any) {
        console.warn('[AutoSync] Error en raspado automático de efemérides:', e?.message);
      } finally {
        syncingEphemeridesMap.delete(dateKey);
      }

      return [];
    })();

    syncingEphemeridesMap.set(dateKey, syncPromise);
    return syncPromise;
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
          imageUrl: normalizeImageUrl(r.imageUrl, ''),
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

  // ALLIANCES & AUSPICIANTES
  static async getAlliances(sector?: AllianceSector, onlyActive: boolean = true): Promise<AlliancePartner[]> {
    try {
      await syncServerAuth();
      const filterParts: string[] = [];
      if (onlyActive) {
        filterParts.push('active=true');
      }
      if (sector && sector !== 'all_sections') {
        filterParts.push(`(sector="${sector}" || sector="all_sections")`);
      }
      const filter = filterParts.join(' && ');

      const records = await pb.collection('alliances').getFullList<any>({
        sort: 'priority',
        filter: filter || undefined,
        requestKey: null,
      });

      if (records) {
        const todayStr = new Date().toISOString().split('T')[0];

        return records
          .map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category || '',
            description: r.description || '',
            imageUrl: normalizeImageUrl(r.imageUrl || (r.image ? pb.files.getUrl(r, r.image) : ''), ''),
            bannerUrl: normalizeImageUrl(r.bannerUrl, ''),
            phone: r.phone || '',
            whatsapp: r.whatsapp || '',
            instagramUrl: r.instagramUrl || '',
            websiteUrl: r.websiteUrl || '',
            email: r.email || '',
            sector: r.sector || 'global_footer',
            active: Boolean(r.active),
            priority: typeof r.priority === 'number' ? r.priority : 1,
            createdDate: r.createdDate || r.created?.split(' ')[0] || '',
            startDate: r.startDate || '',
            endDate: r.endDate || '',
            sponsorUserId: r.sponsorUserId || '',
            pricePaid: typeof r.pricePaid === 'number' ? r.pricePaid : undefined,
            paymentStatus: r.paymentStatus || (r.active ? 'active' : 'expired'),
            paymentId: r.paymentId || '',
          }))
          .filter((item) => {
            if (!onlyActive) return true;
            // Si tiene fecha de expiración y ya pasó, y no es marcado como cortesía manual permanente
            if (item.endDate && item.paymentStatus !== 'manual_free') {
              return item.endDate >= todayStr;
            }
            return item.active;
          })
          .sort((a, b) => {
            // Prioridad absoluta: los auspiciantes de plan transversal (all_sections) van primeros
            const aPrem = a.sector === 'all_sections' ? 1 : 0;
            const bPrem = b.sector === 'all_sections' ? 1 : 0;
            if (bPrem !== aPrem) return bPrem - aPrem;
            return (a.priority || 1) - (b.priority || 1);
          });
      }
    } catch (err) {
      console.warn('Error loading alliances from PocketBase:', err);
    }

    return [];
  }

  static async getAllianceById(id: string): Promise<AlliancePartner | null> {
    try {
      await syncServerAuth();
      const record = await pb.collection('alliances').getOne<any>(id, { requestKey: null });
      if (record) {
        return {
          id: record.id,
          name: record.name,
          category: record.category || '',
          description: record.description || '',
          imageUrl: normalizeImageUrl(record.imageUrl || (record.image ? pb.files.getUrl(record, record.image) : ''), ''),
          bannerUrl: normalizeImageUrl(record.bannerUrl, ''),
          phone: record.phone || '',
          whatsapp: record.whatsapp || '',
          instagramUrl: record.instagramUrl || '',
          websiteUrl: record.websiteUrl || '',
          email: record.email || '',
          sector: record.sector || 'global_footer',
          active: Boolean(record.active),
          priority: typeof record.priority === 'number' ? record.priority : 1,
          createdDate: record.createdDate || record.created?.split(' ')[0] || '',
          startDate: record.startDate || '',
          endDate: record.endDate || '',
          sponsorUserId: record.sponsorUserId || '',
          pricePaid: typeof record.pricePaid === 'number' ? record.pricePaid : undefined,
          paymentStatus: record.paymentStatus || 'active',
          paymentId: record.paymentId || '',
        };
      }
    } catch (err) {
      // not found
    }
    return null;
  }

  // OFFICIAL SOCIAL NETWORKS (@sesionesrg)
  static async getOfficialSocials(): Promise<OfficialSocialsSettings> {
    try {
      await syncServerAuth();
      let record: any = null;
      try {
        record = await pb.collection('site_settings').getFirstListItem('key="official_socials"', {
          requestKey: null,
        });
      } catch {
        try {
          const list = await pb.collection('site_settings').getFullList<any>({ requestKey: null });
          if (list && list.length > 0) record = list[0];
        } catch {}
      }

      if (record && record.data) {
        const d = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
        return {
          id: record.id,
          brandName: d.brandName || '@sesionesrg',
          badgeText: d.badgeText || 'Sesiones RG Oficial',
          tiktok: {
            handle: d.tiktok?.handle ?? 'sesionesrg',
            url: buildSocialUrl('tiktok', d.tiktok?.handle ?? 'sesionesrg'),
            active: d.tiktok?.active !== false,
          },
          instagram: {
            handle: d.instagram?.handle ?? 'sesionesrg',
            url: buildSocialUrl('instagram', d.instagram?.handle ?? 'sesionesrg'),
            active: d.instagram?.active !== false,
          },
          facebook: {
            handle: d.facebook?.handle ?? 'sesionesrg',
            url: buildSocialUrl('facebook', d.facebook?.handle ?? 'sesionesrg'),
            active: d.facebook?.active !== false,
          },
          kick: {
            handle: d.kick?.handle ?? 'sesionesrg',
            url: buildSocialUrl('kick', d.kick?.handle ?? 'sesionesrg'),
            active: d.kick?.active !== false,
          },
          twitch: {
            handle: d.twitch?.handle ?? 'sesionesrg',
            url: buildSocialUrl('twitch', d.twitch?.handle ?? 'sesionesrg'),
            active: d.twitch?.active !== false,
          },
          updatedDate: record.updated?.split(' ')[0] || record.created?.split(' ')[0] || '',
        };
      }
    } catch (err) {
      console.warn('Error fetching official socials from PocketBase, using defaults:', err);
    }

    return DEFAULT_OFFICIAL_SOCIALS;
  }

  static async updateOfficialSocials(settings: OfficialSocialsSettings): Promise<OfficialSocialsSettings> {
    // Si estamos en el navegador, usar la API route autenticada con superusuario en el servidor
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/socials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data) return json.data;
        }
      } catch (clientErr) {
        console.warn('API route /api/admin/socials error, fallback to direct pb:', clientErr);
      }
    }

    try {
      await syncServerAuth();

      const normalized: OfficialSocialsSettings = {
        brandName: settings.brandName || '@sesionesrg',
        badgeText: settings.badgeText || 'Sesiones RG Oficial',
        tiktok: {
          handle: settings.tiktok.handle || '',
          url: buildSocialUrl('tiktok', settings.tiktok.handle),
          active: Boolean(settings.tiktok.active),
        },
        instagram: {
          handle: settings.instagram.handle || '',
          url: buildSocialUrl('instagram', settings.instagram.handle),
          active: Boolean(settings.instagram.active),
        },
        facebook: {
          handle: settings.facebook.handle || '',
          url: buildSocialUrl('facebook', settings.facebook.handle),
          active: Boolean(settings.facebook.active),
        },
        kick: {
          handle: settings.kick.handle || '',
          url: buildSocialUrl('kick', settings.kick.handle),
          active: Boolean(settings.kick.active),
        },
        twitch: {
          handle: settings.twitch.handle || '',
          url: buildSocialUrl('twitch', settings.twitch.handle),
          active: Boolean(settings.twitch.active),
        },
        updatedDate: new Date().toISOString().split('T')[0],
      };

      const payload = {
        key: 'official_socials',
        data: JSON.stringify(normalized),
      };

      let record: any = null;
      if (settings.id) {
        try {
          record = await pb.collection('site_settings').update(settings.id, payload);
        } catch (updateErr) {
          record = await pb.collection('site_settings').create(payload);
        }
      } else {
        try {
          const existing = await pb.collection('site_settings').getFirstListItem('key="official_socials"');
          if (existing) {
            record = await pb.collection('site_settings').update(existing.id, payload);
          } else {
            record = await pb.collection('site_settings').create(payload);
          }
        } catch {
          record = await pb.collection('site_settings').create(payload);
        }
      }

      return {
        ...normalized,
        id: record?.id,
      };
    } catch (err: any) {
      console.warn('Error saving official socials to PocketBase:', err?.message);
      return settings;
    }
  }

  // GENRES
  static getGenresList(): GenreType[] {
    return [
      'Folklore',
      'Pop',
      'Rock',
      'EDM',
      'Dance',
      'Electrónica',
      'Música Urbana',
      'Trap',
      'Hip Hop',
      'Cumbia',
      'Cuarteto',
      'Cumbia / Cuarteto',
      'Indie',
      'Tango',
      'Música Popular',
      'Fusión Latinoamericana',
      'House / Techno',
      'Synthpop',
      'Reggaeton',
      'R&B / Soul',
      'Jazz / Instrumental',
      'Blues / Funk',
      'Reggae / Ska',
      'Chamamé',
      'Acústico / Cantautor',
      'Metal / Punk',
      'Salsa / Bachata',
      'Música Clásica',
    ];
  }
}

