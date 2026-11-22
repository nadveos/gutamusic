import { Buffer } from 'buffer';
import { getServerAdminPb } from '../pocketbase';
import {
  extractSpotifyArtistId,
  extractSpotifyAlbumId,
  extractSpotifyTrackId,
  getSpotifyAccessToken,
  searchSpotifyArtist,
} from './spotifyService';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'd1835e3bf2df453a8edbbb349e549218';
const SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || 'e5d7c1e59ac1496fbcb760962e91b0c2';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar').replace(
  /\/+$/,
  ''
);
const PLAYLIST_ID =
  process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || '5eprX7q6HoedI2nnnHEE2H';

// ID oficial en Spotify de Raúl Domingo (Prioridad #1 fija al tope de la playlist)
const RAUL_DOMINGO_SPOTIFY_ID = '0AMd5Lv1a9CTAdLfbIkf8F';
// Artista amigo invitado que se mantiene siempre en la rotación aunque no tenga ficha en el sitio
const PROTECTED_FRIEND_ARTIST_NAME = 'Carlos Yoel Moreno';

const OAUTH_SETTINGS_KEY = 'spotify_playlist_oauth';
const ROTATION_LOG_KEY = 'spotify_playlist_rotation_log';

export function getSpotifyRedirectUri(): string {
  return process.env.SPOTIFY_REDIRECT_URI || `${SITE_URL}/api/spotify/callback`;
}

export function getSpotifyAuthorizeUrl(): string {
  const scopes = ['playlist-modify-public', 'playlist-modify-private', 'playlist-read-private'];
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: getSpotifyRedirectUri(),
    scope: scopes.join(' '),
    show_dialog: 'true',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

interface StoredSpotifyOAuth {
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
  connectedUser?: string;
  updatedAt: string;
}

export async function saveSpotifyOAuthTokens(data: StoredSpotifyOAuth): Promise<void> {
  const pb = await getServerAdminPb();
  let existing: any = null;
  try {
    existing = await pb
      .collection('site_settings')
      .getFirstListItem(`key="${OAUTH_SETTINGS_KEY}"`, { requestKey: null });
  } catch {}

  const payload = {
    key: OAUTH_SETTINGS_KEY,
    data: JSON.stringify(data),
  };

  if (existing?.id) {
    await pb.collection('site_settings').update(existing.id, payload, { requestKey: null });
  } else {
    await pb.collection('site_settings').create(payload, { requestKey: null });
  }
}

export async function getStoredSpotifyOAuth(): Promise<StoredSpotifyOAuth | null> {
  try {
    const pb = await getServerAdminPb();
    const rec = await pb
      .collection('site_settings')
      .getFirstListItem(`key="${OAUTH_SETTINGS_KEY}"`, { requestKey: null });
    if (!rec?.data) return null;
    const parsed = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
    if (parsed?.refreshToken) return parsed as StoredSpotifyOAuth;
  } catch {}

  if (process.env.SPOTIFY_REFRESH_TOKEN) {
    return {
      refreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
      updatedAt: new Date().toISOString(),
    };
  }
  return null;
}

/**
 * Obtiene un access_token válido con permisos de escritura sobre la playlist del usuario dueño
 */
export async function getPlaylistOwnerAccessToken(): Promise<string | null> {
  const stored = await getStoredSpotifyOAuth();
  if (!stored?.refreshToken) return null;

  if (stored.accessToken && stored.expiresAt && stored.expiresAt > Date.now() + 60000) {
    return stored.accessToken;
  }

  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: stored.refreshToken,
      }).toString(),
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('❌ Error renovando token OAuth de Spotify:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const updated: StoredSpotifyOAuth = {
      ...stored,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || stored.refreshToken,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
      updatedAt: new Date().toISOString(),
    };

    await saveSpotifyOAuthTokens(updated).catch(() => {});
    return updated.accessToken || null;
  } catch (err: any) {
    console.error('❌ Excepción renovando token OAuth de Spotify:', err?.message);
    return null;
  }
}

/**
 * Obtiene hasta `maxTracks` URIs (`spotify:track:...`) de un artista en Spotify
 */
async function getArtistTopTrackUris(
  artistId: string,
  token: string,
  maxTracks = 2
): Promise<{ uris: string[]; artistName: string; trackTitles: string[] }> {
  const uris: string[] = [];
  const trackTitles: string[] = [];
  let artistName = '';

  // 1. Intentar top-tracks oficial
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=AR`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
      for (const t of tracks.slice(0, maxTracks)) {
        if (t?.uri && !uris.includes(t.uri)) {
          uris.push(t.uri);
          trackTitles.push(t.name || 'Track');
          if (!artistName && t.artists?.[0]?.name) {
            artistName = t.artists[0].name;
          }
        }
      }
    }
  } catch {}

  // 2. Si top-tracks no devolvió resultados, buscar en su primer álbum / single
  if (uris.length === 0) {
    try {
      const albumsRes = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on&market=AR&limit=3`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        }
      );
      if (albumsRes.ok) {
        const albumsData = await albumsRes.json();
        const albums = Array.isArray(albumsData?.items) ? albumsData.items : [];
        for (const alb of albums) {
          if (uris.length >= maxTracks) break;
          const tracksRes = await fetch(
            `https://api.spotify.com/v1/albums/${alb.id}/tracks?market=AR&limit=${maxTracks}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store',
            }
          );
          if (tracksRes.ok) {
            const tracksData = await tracksRes.json();
            for (const tr of tracksData?.items || []) {
              if (tr?.uri && !uris.includes(tr.uri) && uris.length < maxTracks) {
                uris.push(tr.uri);
                trackTitles.push(tr.name || 'Track');
                if (!artistName && tr.artists?.[0]?.name) {
                  artistName = tr.artists[0].name;
                }
              }
            }
          }
        }
      }
    } catch {}
  }

  return { uris, artistName, trackTitles };
}

/**
 * Extrae las canciones de un álbum de Spotify (`spotify:track:...`)
 */
async function getAlbumTrackUris(
  albumId: string,
  token: string,
  maxTracks = 2
): Promise<{ uris: string[]; trackTitles: string[] }> {
  const uris: string[] = [];
  const trackTitles: string[] = [];
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?market=AR&limit=${maxTracks}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const tr of data?.items || []) {
        if (tr?.uri && !uris.includes(tr.uri) && uris.length < maxTracks) {
          uris.push(tr.uri);
          trackTitles.push(tr.name || 'Track');
        }
      }
    }
  } catch {}
  return { uris, trackTitles };
}

export interface PlaylistRotationSummary {
  success: boolean;
  rotatedAt: string;
  totalTracks: number;
  raulDomingoTracks: number;
  carlosYoelTracks: number;
  rotatedArtistsCount: number;
  artistsIncluded: string[];
  error?: string;
}

export async function getLastRotationSummary(): Promise<{
  isConnected: boolean;
  connectedUser?: string;
  playlistId: string;
  lastRotation: PlaylistRotationSummary | null;
}> {
  const oauth = await getStoredSpotifyOAuth();
  let lastRotation: PlaylistRotationSummary | null = null;

  try {
    const pb = await getServerAdminPb();
    const rec = await pb
      .collection('site_settings')
      .getFirstListItem(`key="${ROTATION_LOG_KEY}"`, { requestKey: null });
    if (rec?.data) {
      lastRotation = typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data;
    }
  } catch {}

  return {
    isConnected: Boolean(oauth?.refreshToken),
    connectedUser: oauth?.connectedUser,
    playlistId: PLAYLIST_ID,
    lastRotation,
  };
}

/**
 * Ejecuta la rotación automática de la Playlist Oficial de GUTA MÚSICA:
 * 1. Pone en #1 Prioridad fija arriba de todo los temas de Raúl Domingo.
 * 2. Preserva e incluye a Carlos Yoel Moreno (excepción de amigo sin ficha en el sitio).
 * 3. Rota dinámicamente debajo a todos los artistas registrados y aprobados en GUTA que tengan tracks en Spotify.
 */
export async function rotateOfficialSpotifyPlaylist(): Promise<PlaylistRotationSummary> {
  const ownerToken = await getPlaylistOwnerAccessToken();
  const readToken = ownerToken || (await getSpotifyAccessToken());

  if (!ownerToken) {
    return {
      success: false,
      rotatedAt: new Date().toISOString(),
      totalTracks: 0,
      raulDomingoTracks: 0,
      carlosYoelTracks: 0,
      rotatedArtistsCount: 0,
      artistsIncluded: [],
      error:
        'Falta vincular por única vez la cuenta de Spotify dueña de la playlist en /admin/redes.',
    };
  }

  try {
    const pb = await getServerAdminPb();

    // 1. Leer los tracks actuales de la playlist para conservar cualquier track existente de Carlos Yoel Moreno
    const currentFriendUris: string[] = [];
    try {
      const plRes = await fetch(
        `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?market=AR&limit=100`,
        {
          headers: { Authorization: `Bearer ${ownerToken}` },
          cache: 'no-store',
        }
      );
      if (plRes.ok) {
        const plData = await plRes.json();
        for (const item of plData?.items || []) {
          const track = item?.track;
          if (!track?.uri) continue;
          const artistNames: string[] = (track.artists || []).map((a: any) =>
            String(a?.name || '').toLowerCase()
          );
          if (
            artistNames.some(
              (n) => n.includes('carlos yoel moreno') || n.includes('carlos yoel')
            )
          ) {
            if (!currentFriendUris.includes(track.uri)) {
              currentFriendUris.push(track.uri);
            }
          }
        }
      }
    } catch {}

    // Si Carlos Yoel Moreno aún no estaba en los tracks actuales, buscarlo por nombre en Spotify
    if (currentFriendUris.length === 0 && readToken) {
      const friendArtist = await searchSpotifyArtist(PROTECTED_FRIEND_ARTIST_NAME);
      if (friendArtist?.id) {
        const friendTracks = await getArtistTopTrackUris(friendArtist.id, readToken, 2);
        for (const u of friendTracks.uris) {
          if (!currentFriendUris.includes(u)) currentFriendUris.push(u);
        }
      }
    }

    // 2. Obtener todos los artistas aprobados del sitio GUTA MÚSICA
    const allArtists = await pb.collection('artists').getFullList<any>({
      requestKey: null,
    });
    const approvedArtists = allArtists.filter(
      (a) => !a.status || a.status === 'approved' || a.status === 'published'
    );

    // 3. PRIORIDAD #1: Raúl Domingo siempre encabezando la playlist
    const raulUris: string[] = [];
    const raulRecord = approvedArtists.find((a) =>
      String(a.stageName || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes('raul domingo')
    );

    const raulArtistId =
      (raulRecord?.socials?.spotify && extractSpotifyArtistId(raulRecord.socials.spotify)) ||
      RAUL_DOMINGO_SPOTIFY_ID;

    if (readToken) {
      const raulTop = await getArtistTopTrackUris(raulArtistId, readToken, 3);
      for (const u of raulTop.uris) {
        if (!raulUris.includes(u)) raulUris.push(u);
      }

      // También revisar su discografía cargada en PocketBase (ej. EP "Amor en el viento")
      if (raulRecord && Array.isArray(raulRecord.discography)) {
        for (const disc of raulRecord.discography) {
          const albId = extractSpotifyAlbumId(disc?.spotifyUrl || '');
          const trkId = extractSpotifyTrackId(disc?.spotifyUrl || '');
          if (trkId) {
            const uri = `spotify:track:${trkId}`;
            if (!raulUris.includes(uri)) raulUris.push(uri);
          } else if (albId && raulUris.length < 3) {
            const albTracks = await getAlbumTrackUris(albId, readToken, 2);
            for (const u of albTracks.uris) {
              if (!raulUris.includes(u)) raulUris.push(u);
            }
          }
        }
      }
    }

    // 4. Recolectar tracks de todos los demás artistas registrados en GUTA con Spotify
    interface ArtistTrackBucket {
      artistName: string;
      uris: string[];
    }

    const otherArtistBuckets: ArtistTrackBucket[] = [];

    for (const art of approvedArtists) {
      if (raulRecord && art.id === raulRecord.id) continue;

      const spUrl = (art.socials?.spotify || '').trim();
      const artistId = extractSpotifyArtistId(spUrl);
      const albumIdFromSocial = extractSpotifyAlbumId(spUrl);
      const trackIdFromSocial = extractSpotifyTrackId(spUrl);

      const bucketUris: string[] = [];

      if (trackIdFromSocial) {
        bucketUris.push(`spotify:track:${trackIdFromSocial}`);
      } else if (artistId && readToken) {
        const top = await getArtistTopTrackUris(artistId, readToken, 2);
        for (const u of top.uris) {
          if (!bucketUris.includes(u)) bucketUris.push(u);
        }
      } else if (albumIdFromSocial && readToken) {
        const alb = await getAlbumTrackUris(albumIdFromSocial, readToken, 2);
        for (const u of alb.uris) {
          if (!bucketUris.includes(u)) bucketUris.push(u);
        }
      }

      // Si no tenía tracks desde socials.spotify, revisar si tiene spotifyUrl en su discografía
      if (bucketUris.length === 0 && Array.isArray(art.discography) && readToken) {
        for (const d of art.discography) {
          if (bucketUris.length >= 2) break;
          const dUrl = d?.spotifyUrl || '';
          const dTrk = extractSpotifyTrackId(dUrl);
          const dAlb = extractSpotifyAlbumId(dUrl);
          const dArt = extractSpotifyArtistId(dUrl);
          if (dTrk) {
            const u = `spotify:track:${dTrk}`;
            if (!bucketUris.includes(u)) bucketUris.push(u);
          } else if (dAlb) {
            const alb = await getAlbumTrackUris(dAlb, readToken, 2);
            for (const u of alb.uris) {
              if (!bucketUris.includes(u)) bucketUris.push(u);
            }
          } else if (dArt) {
            const top = await getArtistTopTrackUris(dArt, readToken, 2);
            for (const u of top.uris) {
              if (!bucketUris.includes(u)) bucketUris.push(u);
            }
          }
        }
      }

      if (bucketUris.length > 0) {
        otherArtistBuckets.push({
          artistName: art.stageName || 'Artista GUTA',
          uris: bucketUris,
        });
      }
    }

    // Agregar el bucket protegido de Carlos Yoel Moreno dentro del bloque rotativo
    if (currentFriendUris.length > 0) {
      otherArtistBuckets.push({
        artistName: `${PROTECTED_FRIEND_ARTIST_NAME} (Invitado)`,
        uris: currentFriendUris.slice(0, 2),
      });
    }

    // 5. Rotar el orden de los artistas registrados (desplazamiento circular + intercalado round-robin)
    let rotationStep = 0;
    try {
      const prevRec = await pb
        .collection('site_settings')
        .getFirstListItem(`key="${ROTATION_LOG_KEY}"`, { requestKey: null });
      const prevData =
        typeof prevRec?.data === 'string' ? JSON.parse(prevRec.data) : prevRec?.data;
      rotationStep = (Number(prevData?.rotationStep) || 0) + 1;
    } catch {}

    const count = otherArtistBuckets.length;
    const rotatedBuckets: ArtistTrackBucket[] = [];
    if (count > 0) {
      const offset = rotationStep % count;
      for (let i = 0; i < count; i++) {
        rotatedBuckets.push(otherArtistBuckets[(i + offset) % count]);
      }
    }

    // Construir lista final de URIs:
    // Primero Raúl Domingo al tope (#1), luego 1er tema de cada artista rotado, luego 2do tema de cada artista rotado
    const finalUris: string[] = [];
    for (const u of raulUris) {
      if (!finalUris.includes(u)) finalUris.push(u);
    }

    // Ronda 1: Tema principal de cada banda en el nuevo orden rotado
    for (const b of rotatedBuckets) {
      if (b.uris[0] && !finalUris.includes(b.uris[0])) {
        finalUris.push(b.uris[0]);
      }
    }

    // Ronda 2: Segundo tema de cada banda
    for (const b of rotatedBuckets) {
      if (b.uris[1] && !finalUris.includes(b.uris[1])) {
        finalUris.push(b.uris[1]);
      }
    }

    // Spotify permite hasta 100 tracks por petición PUT
    const cappedUris = finalUris.slice(0, 100);

    if (cappedUris.length === 0) {
      return {
        success: false,
        rotatedAt: new Date().toISOString(),
        totalTracks: 0,
        raulDomingoTracks: 0,
        carlosYoelTracks: 0,
        rotatedArtistsCount: 0,
        artistsIncluded: [],
        error: 'No se encontraron tracks de Spotify para actualizar la playlist.',
      };
    }

    // 6. Actualizar la Playlist Oficial en Spotify (PUT reemplaza el orden con la nueva rotación)
    const putRes = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ownerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: cappedUris,
        }),
        cache: 'no-store',
      }
    );

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`Spotify API respondió ${putRes.status}: ${errText}`);
    }

    const artistsIncluded = [
      ...(raulUris.length > 0 ? ['Raúl Domingo (#1 Prioridad)'] : []),
      ...rotatedBuckets.map((b) => b.artistName),
    ];

    const summary: PlaylistRotationSummary & { rotationStep?: number } = {
      success: true,
      rotatedAt: new Date().toISOString(),
      totalTracks: cappedUris.length,
      raulDomingoTracks: raulUris.length,
      carlosYoelTracks: currentFriendUris.length,
      rotatedArtistsCount: artistsIncluded.length,
      artistsIncluded,
      rotationStep,
    };

    // Guardar registro de rotación en PocketBase
    try {
      let existingLog: any = null;
      try {
        existingLog = await pb
          .collection('site_settings')
          .getFirstListItem(`key="${ROTATION_LOG_KEY}"`, { requestKey: null });
      } catch {}

      const logPayload = {
        key: ROTATION_LOG_KEY,
        data: JSON.stringify(summary),
      };

      if (existingLog?.id) {
        await pb
          .collection('site_settings')
          .update(existingLog.id, logPayload, { requestKey: null });
      } else {
        await pb.collection('site_settings').create(logPayload, { requestKey: null });
      }
    } catch {}

    return summary;
  } catch (err: any) {
    console.error('❌ Error rotando Playlist Oficial de Spotify:', err?.message);
    return {
      success: false,
      rotatedAt: new Date().toISOString(),
      totalTracks: 0,
      raulDomingoTracks: 0,
      carlosYoelTracks: 0,
      rotatedArtistsCount: 0,
      artistsIncluded: [],
      error: err?.message || 'Error al actualizar playlist en Spotify',
    };
  }
}
