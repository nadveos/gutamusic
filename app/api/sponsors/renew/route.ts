import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminPb } from '@/lib/pocketbase';
import { createSponsorAlliancePreference } from '@/lib/services/mercadopagoService';
import { getPlanBySector } from '@/lib/constants/sponsorPricing';
import { AllianceSector } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { allianceId } = body;

    if (!allianceId) {
      return NextResponse.json({ success: false, error: 'Falta allianceId para renovar' }, { status: 400 });
    }

    const adminPb = await getServerAdminPb();
    const alliance = await adminPb.collection('alliances').getOne(allianceId);

    if (!alliance) {
      return NextResponse.json({ success: false, error: 'Auspicio no encontrado' }, { status: 404 });
    }

    const plan = getPlanBySector(alliance.sector as AllianceSector);

    const preference = await createSponsorAlliancePreference({
      allianceId: alliance.id,
      brandName: alliance.name,
      sector: alliance.sector as AllianceSector,
      userEmail: alliance.email,
      amount: plan.priceArs,
    });

    return NextResponse.json({
      success: true,
      initPoint: preference.initPoint,
      preferenceId: preference.preferenceId,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/sponsors/renew:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al generar renovación de auspicio' },
      { status: 500 }
    );
  }
}
