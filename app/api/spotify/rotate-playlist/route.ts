import { NextResponse } from 'next/server';
import {
  getLastRotationSummary,
  rotateOfficialSpotifyPlaylist,
  getSpotifyRedirectUri,
} from '@/lib/services/spotifyPlaylistRotationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/spotify/rotate-playlist
 * Devuelve el estado de conexión OAuth y el resumen de la última rotación de la Playlist Oficial
 */
export async function GET() {
  const status = await getLastRotationSummary();
  return NextResponse.json({
    success: true,
    redirectUri: getSpotifyRedirectUri(),
    ...status,
  });
}

/**
 * POST /api/spotify/rotate-playlist
 * Dispara manualmente o vía cron la rotación de artistas en la Playlist Oficial de Spotify
 */
export async function POST() {
  const result = await rotateOfficialSpotifyPlaylist();
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
