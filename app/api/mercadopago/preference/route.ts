import { NextRequest, NextResponse } from 'next/server';
import {
  createDonationPreference,
  createWeeklyFeaturedPreference,
  createSponsorAlliancePreference,
} from '@/lib/services/mercadopagoService';

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

      const pref = await createSponsorAlliancePreference({
        allianceId: body.allianceId,
        brandName: body.brandName,
        sector: body.sector,
        userEmail: body.userEmail,
        amount: body.amount,
      });

      return NextResponse.json({
        success: true,
        initPoint: pref.initPoint,
        preferenceId: pref.preferenceId,
      });
    }

    if (type === 'weekly_featured') {
      if (!body.artistId) {
        return NextResponse.json(
          { success: false, error: 'Falta artistId para el destaque semanal' },
          { status: 400 }
        );
      }

      const pref = await createWeeklyFeaturedPreference({
        artistId: body.artistId,
        artistName: body.artistName || 'Artista Guta',
        userEmail: body.userEmail,
        amount: body.amount,
      });

      return NextResponse.json({
        success: true,
        initPoint: pref.initPoint,
        preferenceId: pref.preferenceId,
      });
    }

    // Por defecto: donación / colaboración voluntaria
    const pref = await createDonationPreference({
      amount: body.amount,
      donorName: body.donorName,
      donorEmail: body.donorEmail,
      message: body.message,
    });

    return NextResponse.json({
      success: true,
      initPoint: pref.initPoint,
      preferenceId: pref.preferenceId,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/mercadopago/preference:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al conectar con Mercado Pago' },
      { status: 500 }
    );
  }
}
