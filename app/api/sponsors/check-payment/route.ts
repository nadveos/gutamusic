import { NextRequest, NextResponse } from 'next/server';
import { checkAndActivateSponsorPayment } from '@/lib/services/mercadopagoService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allianceId = searchParams.get('allianceId');

    if (!allianceId) {
      return NextResponse.json({ paid: false, error: 'allianceId requerido' }, { status: 400 });
    }

    const result = await checkAndActivateSponsorPayment(allianceId);
    return NextResponse.json({
      paid: result.paid,
      alliance: result.alliance,
    });
  } catch (error: any) {
    return NextResponse.json(
      { paid: false, error: error.message || 'Error al verificar pago' },
      { status: 500 }
    );
  }
}
