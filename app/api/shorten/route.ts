import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateShortLink } from '@/lib/services/shortUrlService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = body.url;

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const result = await getOrCreateShortLink({
      targetUrl,
      title: body.title || '',
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/shorten:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al acortar URL' },
      { status: 500 }
    );
  }
}
