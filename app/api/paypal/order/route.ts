import { NextRequest, NextResponse } from 'next/server';
import {
  createPayPalDonationOrder,
  createPayPalSponsorOrder,
} from '@/lib/services/paypalService';
import { AllianceSector } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || 'donation';

    if (type === 'sponsor_alliance') {
      if (!body.allianceId || !body.brandName || !body.sector) {
        return NextResponse.json(
          { success: false, error: 'Faltan datos obligatorios (allianceId, brandName, sector)' },
          { status: 400 }
        );
      }

      const order = await createPayPalSponsorOrder({
        allianceId: body.allianceId,
        brandName: body.brandName,
        sector: body.sector as AllianceSector,
        userEmail: body.userEmail,
        amountUsd: body.amountUsd,
        amountArs: body.amountArs,
      });

      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        approveUrl: order.approveUrl,
        initPoint: order.approveUrl,
      });
    }

    // Por defecto: Colaboración Voluntaria (Donación en USD)
    const order = await createPayPalDonationOrder({
      amountUsd: Number(body.amountUsd || body.amount || 5),
      donorName: body.donorName,
      donorEmail: body.donorEmail,
      message: body.message,
    });

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      approveUrl: order.approveUrl,
      initPoint: order.approveUrl,
    });
  } catch (err: any) {
    console.error('❌ Error en POST /api/paypal/order:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al conectar con PayPal' },
      { status: 500 }
    );
  }
}
