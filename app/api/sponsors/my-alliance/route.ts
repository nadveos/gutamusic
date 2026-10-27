import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminPb } from '@/lib/pocketbase';
import { getDaysRemaining } from '@/lib/constants/sponsorPricing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    const adminPb = await getServerAdminPb();

    let record: any = null;

    if (id) {
      try {
        record = await adminPb.collection('alliances').getOne(id);
      } catch {}
    }

    if (!record && email) {
      try {
        record = await adminPb
          .collection('alliances')
          .getFirstListItem(`email = "${email.trim().toLowerCase()}"`, {
            sort: '-created',
          });
      } catch {}
    }

    if (!record) {
      return NextResponse.json({ success: false, error: 'Auspicio no encontrado' }, { status: 404 });
    }

    const remaining = getDaysRemaining(record.endDate);

    return NextResponse.json({
      success: true,
      alliance: {
        id: record.id,
        name: record.name,
        category: record.category || '',
        description: record.description || '',
        imageUrl: record.imageUrl || '',
        phone: record.phone || '',
        whatsapp: record.whatsapp || '',
        websiteUrl: record.websiteUrl || '',
        email: record.email || '',
        sector: record.sector || 'global_footer',
        active: Boolean(record.active),
        startDate: record.startDate || '',
        endDate: record.endDate || '',
        paymentStatus: record.paymentStatus || 'active',
        pricePaid: record.pricePaid,
        daysRemaining: remaining.days,
        isExpired: remaining.isExpired,
        statusLabel: remaining.label,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener datos del auspicio' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, description, imageUrl, phone, whatsapp, websiteUrl, category } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta ID de la alianza' }, { status: 400 });
    }

    const adminPb = await getServerAdminPb();

    const updated = await adminPb.collection('alliances').update(id, {
      description: description ?? undefined,
      imageUrl: imageUrl ?? undefined,
      phone: phone ?? undefined,
      whatsapp: whatsapp ?? undefined,
      websiteUrl: websiteUrl ?? undefined,
      category: category ?? undefined,
    });

    return NextResponse.json({
      success: true,
      alliance: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar datos' },
      { status: 500 }
    );
  }
}
