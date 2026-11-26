import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateShortLink } from '@/lib/services/shortUrlService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = typeof body?.url === 'string' ? body.url.trim() : '';

    if (!targetUrl || targetUrl.length > 500) {
      return NextResponse.json({ error: 'URL requerida o inválida' }, { status: 400 });
    }

    const title = typeof body?.title === 'string' ? body.title.slice(0, 200) : '';

    const result = await getOrCreateShortLink({
      targetUrl,
      title,
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=3600',
        },
      }
    );
  } catch (error: any) {
    console.error('❌ Error en /api/shorten:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al acortar URL' },
      { status: 500 }
    );
  }
}
