import { NextRequest, NextResponse } from 'next/server';
import { MusicDataService, getArgentinaDayMonth } from '@/lib/api';
import { getServerAdminPb } from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    if (q.length >= 2) {
      const pb = await getServerAdminPb();
      const safeQ = q.replace(/"/g, '\\"');
      const records = await pb.collection('ephemerides').getList(1, 100, {
        filter: `title ~ "${safeQ}" || description ~ "${safeQ}" || source ~ "${safeQ}"`,
        sort: 'year',
        requestKey: null,
      });

      const items = records.items.map((r: any) => ({
        id: r.id,
        day: r.day,
        month: r.month,
        year: r.year,
        title: r.title,
        description: r.description,
        category: r.category,
        categoryLabel: r.categoryLabel,
        source: r.source,
        imageUrl: r.imageUrl || '',
        artistRelated: r.artistRelated || '',
        impactBadge: r.impactBadge || '',
      }));

      return NextResponse.json({
        success: true,
        q,
        count: items.length,
        items,
      });
    }

    const argNow = getArgentinaDayMonth();

    const dayParam = Number(searchParams.get('day'));
    const monthParam = Number(searchParams.get('month'));

    const day = dayParam >= 1 && dayParam <= 31 ? dayParam : argNow.day;
    const month = monthParam >= 1 && monthParam <= 12 ? monthParam : argNow.month;

    const items = await MusicDataService.getTodayEphemerides(day, month);

    return NextResponse.json({
      success: true,
      day,
      month,
      count: items.length,
      items,
    });
  } catch (err: any) {
    console.error('Error en /api/efemerides/sync:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error sincronizando efemérides' },
      { status: 500 }
    );
  }
}
