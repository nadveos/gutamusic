import { Buffer } from 'buffer';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'd1835e3bf2df453a8edbbb349e549218';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || 'e5d7c1e59ac1496fbcb760962e91b0c2';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('⚠️ SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET no configurados.');
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3000 },
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
  // https://open.spotify.com/artist/0AMd5Lv1a9CTAdLfbIkf8F
  // https://open.spotify.com/intl-es/artist/0AMd5Lv1a9CTAdLfbIkf8F/discography
  const match = trimmed.match(/artist\/([a-zA-Z0-9]+)/);
  if (match) {
    return match[1];
  }

  return null;
}

export function extractSpotifyPlaylistId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // Si ya es un ID de Spotify de 22 caracteres
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }

  // Capturar de URLs de playlist:
  // https://open.spotify.com/playlist/5eprX7q6HoedI2nnnHEE2H?si=...
  // https://open.spotify.com/intl-es/playlist/5eprX7q6HoedI2nnnHEE2H
  // spotify:playlist:5eprX7q6HoedI2nnnHEE2H
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
    const res = await fetch(`https://api.spotify.com/v1/playlists/${id}?fields=id,name,description,external_urls,images,followers,owner`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }
    });

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


export async function searchSpotifyArtist(artistName: string): Promise<{ id: string; name: string; url: string; photoUrl?: string } | null> {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(artistName);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const artists = data?.artists?.items || [];
    if (artists.length === 0) return null;

    // Buscar coincidencia exacta o tomar el primer resultado
    const exact = artists.find((a: any) => a.name.toLowerCase().trim() === artistName.toLowerCase().trim()) || artists[0];

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
  const token = await getSpotifyAccessToken();
  if (!token) return [];

  try {
    const allItems: any[] = [];
    const limit = 10;

    // Consultar tanto álbumes como sencillos oficiales con paginación
    for (const group of ['album', 'single']) {
      let offset = 0;
      while (offset < 40) {
        const res = await fetch(
          `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=${group}&limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          console.error(`Error fetching ${group} page from Spotify:`, res.status);
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

    const items = allItems;

    const seenTitles = new Set<string>();
    const results: SpotifyAlbumItem[] = [];

    for (const item of items) {
      // Normalizar nombre para evitar duplicar versiones deluxe idénticas
      const normTitle = item.name.toLowerCase().trim();
      if (seenTitles.has(normTitle)) continue;
      seenTitles.add(normTitle);

      const releaseYear = parseInt((item.release_date || '').split('-')[0], 10) || new Date().getFullYear();
      
      let type: 'album' | 'single' | 'ep' | 'live_album' = 'album';
      if (item.album_type === 'single') {
        type = item.total_tracks >= 4 ? 'ep' : 'single';
      } else if (normTitle.includes('en vivo') || normTitle.includes('live')) {
        type = 'live_album';
      }

      // Spotify provee imágenes en orden [640, 300, 64]
      const coverUrl = item.images?.[0]?.url || item.images?.[1]?.url || '';

      results.push({
        id: `disc-sp-${item.id}`,
        title: item.name,
        type,
        year: releaseYear,
        coverUrl,
        spotifyUrl: item.external_urls?.spotify || '',
        tracksCount: item.total_tracks || 1,
      });
    }

    // Ordenar del más reciente al más antiguo
    return results.sort((a, b) => b.year - a.year);
  } catch (err: any) {
    console.error('Excepción obteniendo discografía de Spotify:', err.message);
    return [];
  }
}
