import { NextResponse } from 'next/server';
import { getSpotifyAuthorizeUrl } from '@/lib/services/spotifyPlaylistRotationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/spotify/auth
 * Redirige al administrador a la pantalla de autorización de Spotify
 * para vincular la cuenta dueña de la Playlist Oficial de GUTA MÚSICA.
 */
export async function GET() {
  const authUrl = getSpotifyAuthorizeUrl();
  return NextResponse.redirect(authUrl);
}
