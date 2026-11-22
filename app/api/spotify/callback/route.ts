import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';
import {
  getSpotifyRedirectUri,
  saveSpotifyOAuthTokens,
  rotateOfficialSpotifyPlaylist,
} from '@/lib/services/spotifyPlaylistRotationService';

export const dynamic = 'force-dynamic';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'd1835e3bf2df453a8edbbb349e549218';
const SPOTIFY_CLIENT_SECRET =
  process.env.SPOTIFY_CLIENT_SECRET || 'e5d7c1e59ac1496fbcb760962e91b0c2';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar').replace(
  /\/+$/,
  ''
);

/**
 * GET /api/spotify/callback
 * Recibe el código OAuth de Spotify, guarda el refresh_token permanente en PocketBase
 * y ejecuta la primera sincronización de la Playlist Oficial.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(
      `${SITE_URL}/admin/redes?spotify_error=${encodeURIComponent(error || 'missing_code')}`
    );
  }

  try {
    const creds = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getSpotifyRedirectUri(),
      }).toString(),
      cache: 'no-store',
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('❌ Error en /api/spotify/callback:', errText);
      return NextResponse.redirect(
        `${SITE_URL}/admin/redes?spotify_error=${encodeURIComponent('token_exchange_failed')}`
      );
    }

    const tokenData = await tokenRes.json();

    // Consultar perfil del usuario conectado
    let connectedUser = 'Guta Música';
    try {
      const meRes = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const meData = await meRes.json();
        connectedUser = meData.display_name || meData.id || 'Guta Música';
      }
    } catch {}

    await saveSpotifyOAuthTokens({
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      connectedUser,
      updatedAt: new Date().toISOString(),
    });

    // Ejecutar primera rotación inmediatamente
    await rotateOfficialSpotifyPlaylist().catch(() => {});

    return NextResponse.redirect(`${SITE_URL}/admin/redes?spotify=connected`);
  } catch (err: any) {
    console.error('❌ Excepción en /api/spotify/callback:', err?.message);
    return NextResponse.redirect(
      `${SITE_URL}/admin/redes?spotify_error=${encodeURIComponent(err?.message || 'callback_error')}`
    );
  }
}
