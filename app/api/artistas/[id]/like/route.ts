import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { pb, ensureServerSuperUserAuth } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

// In-memory rate limiting map: ipHash -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

const IP_SALT = process.env.LIKE_IP_SALT || 'guta-music-secret-salt-2026';

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(`${ip}-${IP_SALT}`).digest('hex');
}

function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ipHash) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(ipHash, validTimestamps);
  return true;
}

async function getArtistRecord(identifier: string): Promise<RecordModel | null> {
  await ensureServerSuperUserAuth();
  try {
    return await pb.collection('artists').getOne<RecordModel>(identifier, { requestKey: null });
  } catch {
    try {
      return await pb.collection('artists').getFirstListItem<RecordModel>(`slug="${identifier}"`, { requestKey: null });
    } catch {
      return null;
    }
  }
}

// GET: Check current likes count and whether this IP has liked the artist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientIp = getClientIp(request);
  const ipHash = hashIp(clientIp);

  const artist = await getArtistRecord(id);
  if (!artist) {
    return NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 });
  }

  let isLiked = false;
  try {
    const existing = await pb
      .collection('artist_likes')
      .getFirstListItem(`artist="${artist.id}" && ipHash="${ipHash}"`, { requestKey: null });
    if (existing) {
      isLiked = true;
    }
  } catch {
    // No record found or collection doesn't exist yet
    isLiked = false;
  }

  const likesCount = typeof artist.likesCount === 'number' ? artist.likesCount : (parseInt(artist.likesCount, 10) || 0);

  return NextResponse.json({
    likesCount,
    isLiked,
    artistId: artist.id,
  });
}

// POST: Toggle like for this artist from this IP
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientIp = getClientIp(request);
  const ipHash = hashIp(clientIp);

  if (!checkRateLimit(ipHash)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor esperá un momento.' },
      { status: 429 }
    );
  }

  const artist = await getArtistRecord(id);
  if (!artist) {
    return NextResponse.json({ error: 'Artista no encontrado' }, { status: 404 });
  }

  let currentLikes = typeof artist.likesCount === 'number' ? artist.likesCount : (parseInt(String(artist.likesCount), 10) || 0);
  let isLiked = false;
  let existingLikeRecord: RecordModel | null = null;

  try {
    existingLikeRecord = await pb
      .collection('artist_likes')
      .getFirstListItem<RecordModel>(`artist="${artist.id}" && ipHash="${ipHash}"`, { requestKey: null });
  } catch {
    existingLikeRecord = null;
  }

  try {
    if (existingLikeRecord) {
      // Toggle OFF: Remove like
      await pb.collection('artist_likes').delete(existingLikeRecord.id);
      currentLikes = Math.max(0, currentLikes - 1);
      isLiked = false;
    } else {
      // Toggle ON: Add like
      try {
        await pb.collection('artist_likes').create({
          artist: artist.id,
          ipHash,
        });
      } catch (createErr: unknown) {
        const msg = createErr instanceof Error ? createErr.message : String(createErr);
        console.warn('Notice: artist_likes creation error (or collection pending in PB):', msg);
      }
      currentLikes += 1;
      isLiked = true;
    }

    // Update count on artist record
    try {
      await pb.collection('artists').update(artist.id, {
        likesCount: currentLikes,
      });
    } catch (updateErr: unknown) {
      const msg = updateErr instanceof Error ? updateErr.message : String(updateErr);
      console.warn('Notice: Error updating likesCount on artist in PB:', msg);
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: currentLikes,
      artistId: artist.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error toggling like:', err);
    return NextResponse.json(
      { error: 'Error al procesar el like', details: msg },
      { status: 500 }
    );
  }
}
