import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminPb } from '../../../../lib/pocketbase';
import { buildSocialUrl } from '../../../../lib/socialUtils';
import { OfficialSocialsSettings } from '../../../../lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const adminPb = await getServerAdminPb();
    let record: any = null;
    try {
      record = await adminPb.collection('site_settings').getFirstListItem('key="official_socials"');
    } catch {
      const list = await adminPb.collection('site_settings').getFullList<any>();
      if (list && list.length > 0) record = list[0];
    }

    if (record && record.data) {
      const d = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
      return NextResponse.json({
        id: record.id,
        brandName: d.brandName || '@sesionesrg',
        badgeText: d.badgeText || 'Sesiones RG Oficial',
        tiktok: {
          handle: d.tiktok?.handle ?? 'sesionesrg',
          url: buildSocialUrl('tiktok', d.tiktok?.handle ?? 'sesionesrg'),
          active: d.tiktok?.active !== false,
        },
        instagram: {
          handle: d.instagram?.handle ?? 'sesionesrg',
          url: buildSocialUrl('instagram', d.instagram?.handle ?? 'sesionesrg'),
          active: d.instagram?.active !== false,
        },
        facebook: {
          handle: d.facebook?.handle ?? 'sesionesrg',
          url: buildSocialUrl('facebook', d.facebook?.handle ?? 'sesionesrg'),
          active: d.facebook?.active !== false,
        },
        kick: {
          handle: d.kick?.handle ?? 'sesionesrg',
          url: buildSocialUrl('kick', d.kick?.handle ?? 'sesionesrg'),
          active: d.kick?.active !== false,
        },
        twitch: {
          handle: d.twitch?.handle ?? 'sesionesrg',
          url: buildSocialUrl('twitch', d.twitch?.handle ?? 'sesionesrg'),
          active: d.twitch?.active !== false,
        },
        updatedDate: record.updated?.split(' ')[0] || record.created?.split(' ')[0] || '',
      });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error consultando site_settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: OfficialSocialsSettings = await req.json();
    const adminPb = await getServerAdminPb();

    const normalized: OfficialSocialsSettings = {
      brandName: body.brandName || '@sesionesrg',
      badgeText: body.badgeText || 'Sesiones RG Oficial',
      tiktok: {
        handle: body.tiktok?.handle || 'sesionesrg',
        url: buildSocialUrl('tiktok', body.tiktok?.handle || 'sesionesrg'),
        active: body.tiktok?.active !== false,
      },
      instagram: {
        handle: body.instagram?.handle || 'sesionesrg',
        url: buildSocialUrl('instagram', body.instagram?.handle || 'sesionesrg'),
        active: body.instagram?.active !== false,
      },
      facebook: {
        handle: body.facebook?.handle || 'sesionesrg',
        url: buildSocialUrl('facebook', body.facebook?.handle || 'sesionesrg'),
        active: body.facebook?.active !== false,
      },
      kick: {
        handle: body.kick?.handle || 'sesionesrg',
        url: buildSocialUrl('kick', body.kick?.handle || 'sesionesrg'),
        active: body.kick?.active !== false,
      },
      twitch: {
        handle: body.twitch?.handle || 'sesionesrg',
        url: buildSocialUrl('twitch', body.twitch?.handle || 'sesionesrg'),
        active: body.twitch?.active !== false,
      },
      updatedDate: new Date().toISOString().split('T')[0],
    };

    const payload = {
      key: 'official_socials',
      data: JSON.stringify(normalized),
    };

    let record: any = null;
    try {
      const existing = await adminPb.collection('site_settings').getFirstListItem('key="official_socials"');
      if (existing) {
        record = await adminPb.collection('site_settings').update(existing.id, payload);
      } else {
        record = await adminPb.collection('site_settings').create(payload);
      }
    } catch {
      record = await adminPb.collection('site_settings').create(payload);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...normalized,
        id: record?.id,
      },
    });
  } catch (err: any) {
    console.error('Error saving official socials in API route:', err);
    return NextResponse.json({ error: err?.message || 'Error guardando redes sociales' }, { status: 500 });
  }
}
