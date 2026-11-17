import { Buffer } from 'buffer';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'd1835e3bf2df453a8edbbb349e549218';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'e5d7c1e59ac1496fbcb760962e91b0c2';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyAccessToken(forceRefresh = false): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('⚠️ SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET no configurados.');
    return null;
  }

  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('❌ Error obteniendo Spotify token:', res.status, err);
      return null;
    }

    const data = await res.json();
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    };

    return cachedToken.token;
  } catch (err: any) {
    console.error('❌ Excepción al autenticar con Spotify:', err.message);
    return null;
  }
}

export function extractSpotifyArtistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Si ya es un ID de Spotify alfanumérico de 22 caracteres
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex para capturar de URLs como:
  // https://open.spotify.com/artist/7gSTPTbUxkJibimBv8Zq71
  // https://open.spotify.com/intl-es/artist/7gSTPTbUxkJibimBv8Zq71?si=...
  // https://open.spotify.com/intl-es/artist/7gSTPTbUxkJibimBv8Zq71/discography
  // spotify:artist:7gSTPTbUxkJibimBv8Zq71
  const match = trimmed.match(/(?:artist\/|spotify:artist:)([a-zA-Z0-9]{22})/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export function extractSpotifyAlbumId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/(?:album\/|spotify:album:)([a-zA-Z0-9]{22})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function extractSpotifyTrackId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/(?:track\/|spotify:track:)([a-zA-Z0-9]{22})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

export function extractSpotifyPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/(?:playlist\/|spotify:playlist:)([a-zA-Z0-9]{22})/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

export interface SpotifyPlaylistData {
  id: string;
  name: string;
  description: string;
  externalUrl: string;
  imageUrl?: string;
  followers?: number;
  ownerName?: string;
}

export async function getSpotifyPlaylist(playlistIdOrUrl: string): Promise<SpotifyPlaylistData | null> {
  const id = extractSpotifyPlaylistId(playlistIdOrUrl);
  if (!id) return null;

  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?fields=id,name,description,external_urls,images,followers,owner`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      console.warn(`Error al consultar playlist ${id} en Spotify:`, res.status);
      return null;
    }

    const data = await res.json();
    return {
      id: data.id,
      name: data.name || 'Top Artistas Emergentes by Guta 1',
      description: data.description || '',
      externalUrl: data.external_urls?.spotify || `https://open.spotify.com/playlist/${data.id}`,
      imageUrl: data.images?.[0]?.url,
      followers: data.followers?.total || 0,
      ownerName: data.owner?.display_name || 'Guta Música',
    };
  } catch (err: any) {
    console.error('Excepción al consultar playlist de Spotify:', err?.message);
    return null;
  }
}

function normalizeNameForMatch(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Respaldo público sin necesidad de API Key mediante Spotify oEmbed y Embed __NEXT_DATA__
 * Garantiza 100% de disponibilidad incluso si la Web API de Spotify limita o rechaza peticiones.
 */
async function fetchSpotifyArtistPublicFallback(artistId: string): Promise<{
  id: string;
  name: string;
  url: string;
  photoUrl: string;
  tracks: SpotifyAlbumItem[];
} | null> {
  const cleanId = extractSpotifyArtistId(artistId);
  if (!cleanId) return null;

  const canonicalUrl = `https://open.spotify.com/artist/${cleanId}`;
  let name = '';
  let photoUrl = '';
  const tracks: SpotifyAlbumItem[] = [];

  // 1. Consultar oEmbed oficial público de Spotify
  try {
    const oembedRes = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GutaMusica/1.0)',
        },
        cache: 'no-store',
      }
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData?.title) name = String(oembedData.title).trim();
      if (oembedData?.thumbnail_url) photoUrl = String(oembedData.thumbnail_url).trim();
    }
  } catch (e) {
    console.warn('Spotify oEmbed fallback warning:', e);
  }

  // 2. Consultar página pública de Embed para extraer __NEXT_DATA__ (nombre, imagen y top tracks)
  try {
    const embedRes = await fetch(`https://open.spotify.com/embed/artist/${cleanId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      cache: 'no-store',
    });

    if (embedRes.ok) {
      const html = await embedRes.text();
      const match = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );
      if (match && match[1]) {
        const nextData = JSON.parse(match[1]);
        const entity = nextData?.props?.pageProps?.state?.data?.entity;
        if (entity) {
          if (!name && entity.name) {
            name = String(entity.name).trim();
          }
          const images = entity.visualIdentity?.image || [];
          if (!photoUrl && Array.isArray(images) && images.length > 0) {
            // Elegir la imagen de mayor resolución
            const sortedImgs = [...images].sort(
              (a: any, b: any) => (b.maxWidth || 0) - (a.maxWidth || 0)
            );
            photoUrl = sortedImgs[0]?.url || '';
          }

          const trackList = entity.trackList || [];
          const currentYear = new Date().getFullYear();
          const seenTitles = new Set<string>();

          for (const t of trackList) {
            const title = (t.title || '').trim();
            if (!title) continue;
            const norm = title.toLowerCase();
            if (seenTitles.has(norm)) continue;
            seenTitles.add(norm);

            const trackUri: string = t.uri || '';
            const trackIdMatch = trackUri.match(/spotify:track:([a-zA-Z0-9]{22})/);
            const trackId = trackIdMatch ? trackIdMatch[1] : `${cleanId}-${tracks.length}`;
            const trackUrl = trackIdMatch
              ? `https://open.spotify.com/track/${trackId}`
              : canonicalUrl;

            tracks.push({
              id: `disc-sp-${trackId}`,
              title,
              type: 'single',
              year: currentYear,
              coverUrl: photoUrl,
              spotifyUrl: trackUrl,
              tracksCount: 1,
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn('Spotify embed fallback warning:', e);
  }

  if (!name && !photoUrl && tracks.length === 0) {
    return null;
  }

  return {
    id: cleanId,
    name: name || 'Artista de Spotify',
    url: canonicalUrl,
    photoUrl,
    tracks,
  };
}

export async function getSpotifyArtistById(
  artistId: string
): Promise<{ id: string; name: string; url: string; photoUrl?: string; genres?: string[] } | null> {
  const cleanId = extractSpotifyArtistId(artistId);
  if (!cleanId) return null;

  let token = await getSpotifyAccessToken();
  if (token) {
    try {
      let res = await fetch(`https://api.spotify.com/v1/artists/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });

      if (res.status === 401) {
        token = await getSpotifyAccessToken(true);
        if (token) {
          res = await fetch(`https://api.spotify.com/v1/artists/${cleanId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
        }
      }

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          name: data.name || '',
          url: data.external_urls?.spotify || `https://open.spotify.com/artist/${data.id}`,
          photoUrl: data.images?.[0]?.url || '',
          genres: Array.isArray(data.genres) ? data.genres : [],
        };
      }
    } catch (err: any) {
      console.error('Error consultando artista por ID en Spotify Web API:', err.message);
    }
  }

  // Fallback público garantizado (oEmbed + Embed)
  const fallback = await fetchSpotifyArtistPublicFallback(cleanId);
  if (fallback) {
    return {
      id: fallback.id,
      name: fallback.name,
      url: fallback.url,
      photoUrl: fallback.photoUrl,
      genres: [],
    };
  }

  return null;
}

export async function searchSpotifyArtist(
  artistName: string
): Promise<{ id: string; name: string; url: string; photoUrl?: string } | null> {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(artistName.trim());
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const data = await res.json();
    const artists = data?.artists?.items || [];
    if (artists.length === 0) return null;

    const targetNorm = normalizeNameForMatch(artistName);
    const exact =
      artists.find((a: any) => normalizeNameForMatch(a.name || '') === targetNorm) || artists[0];

    if (!exact) {
      return null;
    }

    return {
      id: exact.id,
      name: exact.name,
      url: exact.external_urls?.spotify || '',
      photoUrl: exact.images?.[0]?.url || '',
    };
  } catch (err: any) {
    console.error('Error buscando artista en Spotify:', err.message);
    return null;
  }
}

export async function getSpotifyAlbumById(
  albumIdOrUrl: string
): Promise<{ album: SpotifyAlbumItem; artistId?: string; artistName?: string } | null> {
  const albumId =
    extractSpotifyAlbumId(albumIdOrUrl) ||
    (/^[a-zA-Z0-9]{22}$/.test(albumIdOrUrl.trim()) ? albumIdOrUrl.trim() : null);
  if (!albumId) return null;

  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;

    const item = await res.json();
    const normTitle = (item.name || '').toLowerCase().trim();
    const releaseYear =
      parseInt((item.release_date || '').split('-')[0], 10) || new Date().getFullYear();

    let type: 'album' | 'single' | 'ep' | 'live_album' = 'album';
    if (item.album_type === 'single') {
      type = (item.total_tracks || 1) >= 4 ? 'ep' : 'single';
    } else if (normTitle.includes('en vivo') || normTitle.includes('live')) {
      type = 'live_album';
    }

    const coverUrl = item.images?.[0]?.url || item.images?.[1]?.url || '';
    const primaryArtist = item.artists?.[0];

    return {
      album: {
        id: `disc-sp-${item.id}`,
        title: item.name,
        type,
        year: releaseYear,
        coverUrl,
        spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/album/${item.id}`,
        tracksCount: item.total_tracks || 1,
      },
      artistId: primaryArtist?.id,
      artistName: primaryArtist?.name,
    };
  } catch (err: any) {
    console.error('Error obteniendo álbum por ID en Spotify:', err.message);
    return null;
  }
}

export interface SpotifyAlbumItem {
  id: string;
  title: string;
  type: 'album' | 'single' | 'ep' | 'live_album';
  year: number;
  coverUrl: string;
  spotifyUrl: string;
  tracksCount: number;
}

export async function getSpotifyArtistDiscography(artistId: string): Promise<SpotifyAlbumItem[]> {
  const cleanId = extractSpotifyArtistId(artistId) || artistId.trim();
  const token = await getSpotifyAccessToken();

  if (token) {
    try {
      const allItems: any[] = [];
      const limit = 20;

      // 1. Consultar álbumes y sencillos propios (con market=AR para asegurar disponibilidad regional)
      for (const group of ['album', 'single']) {
        let offset = 0;
        while (offset < 40) {
          const res = await fetch(
            `https://api.spotify.com/v1/artists/${cleanId}/albums?include_groups=${group}&market=AR&limit=${limit}&offset=${offset}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            }
          );

          if (!res.ok) {
            break;
          }

          const data = await res.json();
          const items = data.items || [];
          allItems.push(...items);

          if (items.length < limit || offset + items.length >= (data.total || 0)) {
            break;
          }
          offset += limit;
        }
      }

      // 2. Si el artista aún no tiene álbumes/singles principales, revisar 'appears_on' y 'compilation'
      if (allItems.length === 0) {
        const resAppears = await fetch(
          `https://api.spotify.com/v1/artists/${cleanId}/albums?include_groups=appears_on,compilation&market=AR&limit=20`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          }
        );
        if (resAppears.ok) {
          const dataAppears = await resAppears.json();
          allItems.push(...(dataAppears.items || []));
        }
      }

      const seenTitles = new Set<string>();
      const results: SpotifyAlbumItem[] = [];

      for (const item of allItems) {
        const normTitle = (item.name || '').toLowerCase().trim();
        if (!normTitle || seenTitles.has(normTitle)) continue;
        seenTitles.add(normTitle);

        const releaseYear =
          parseInt((item.release_date || '').split('-')[0], 10) || new Date().getFullYear();

        let type: 'album' | 'single' | 'ep' | 'live_album' = 'album';
        if (item.album_type === 'single') {
          type = item.total_tracks >= 4 ? 'ep' : 'single';
        } else if (normTitle.includes('en vivo') || normTitle.includes('live')) {
          type = 'live_album';
        }

        const coverUrl = item.images?.[0]?.url || item.images?.[1]?.url || '';

        results.push({
          id: `disc-sp-${item.id}`,
          title: item.name,
          type,
          year: releaseYear,
          coverUrl,
          spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/album/${item.id}`,
          tracksCount: item.total_tracks || 1,
        });
      }

      if (results.length > 0) {
        return results.sort((a, b) => b.year - a.year);
      }
    } catch (err: any) {
      console.error('Excepción obteniendo discografía de Spotify Web API:', err.message);
    }
  }

  // 3. Respaldo público (Embed __NEXT_DATA__) si la API devolvió 0 resultados o falló
  const fallback = await fetchSpotifyArtistPublicFallback(cleanId);
  if (fallback && fallback.tracks.length > 0) {
    return fallback.tracks;
  }

  return [];
}
