import { NextRequest, NextResponse } from 'next/server';
import { getProfessionalBySlugOrId } from '@/lib/services/professionalsService';
import {
  createProfessionalFeaturedPreference,
  createProfessionalFeaturedQrOrder,
  checkAndActivateProfessionalPayment,
} from '@/lib/services/mercadopagoService';
import { createPayPalProfessionalOrder } from '@/lib/services/paypalService';
import {
  PROFESSIONAL_FEATURED_PRICE_ARS,
  PROFESSIONAL_FEATURED_PRICE_USD,
} from '@/lib/constants/professionalCategories';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { professionalId, paymentProvider = 'mercadopago' } = body;

    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: 'Falta professionalId para activar el destaque semanal' },
        { status: 400 }
      );
    }

    const prof = await getProfessionalBySlugOrId(professionalId);
    if (!prof) {
      return NextResponse.json(
        { success: false, error: 'Perfil profesional no encontrado' },
        { status: 404 }
      );
    }

    if (paymentProvider === 'paypal') {
      const ppOrder = await createPayPalProfessionalOrder({
        professionalId: prof.id,
        professionalName: prof.name,
        userEmail: prof.email,
        amountUsd: PROFESSIONAL_FEATURED_PRICE_USD,
        amountArs: PROFESSIONAL_FEATURED_PRICE_ARS,
      });

      return NextResponse.json({
        success: true,
        initPoint: ppOrder.approveUrl,
        orderId: ppOrder.orderId,
      });
    }

    if (paymentProvider === 'mercadopago_qr') {
      const qrOrder = await createProfessionalFeaturedQrOrder({
        professionalId: prof.id,
        professionalName: prof.name,
        userEmail: prof.email,
        amount: PROFESSIONAL_FEATURED_PRICE_ARS,
      });

      return NextResponse.json({
        success: true,
        qrData: qrOrder.qrData,
        staticPosQrImage: qrOrder.staticPosQrImage,
        isInteroperableEmvco: qrOrder.isInteroperableEmvco,
        initPoint: qrOrder.initPoint,
        preferenceId: qrOrder.preferenceId,
        professionalId: prof.id,
        amountArs: qrOrder.amountArs,
      });
    }

    const mpPref = await createProfessionalFeaturedPreference({
      professionalId: prof.id,
      professionalName: prof.name,
      userEmail: prof.email,
      amount: PROFESSIONAL_FEATURED_PRICE_ARS,
    });

    return NextResponse.json({
      success: true,
      initPoint: mpPref.initPoint,
      preferenceId: mpPref.preferenceId,
    });
  } catch (err: any) {
    console.error('❌ Error en POST /api/professionals/featured-checkout:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al generar el pago de destaque semanal' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const professionalId = searchParams.get('professionalId');

    if (!professionalId) {
      return NextResponse.json({ paid: false, error: 'professionalId requerido' }, { status: 400 });
    }

    const res = await checkAndActivateProfessionalPayment(professionalId);
    return NextResponse.json({
      paid: res.paid,
      professional: res.professional,
    });
  } catch (err: any) {
    return NextResponse.json({ paid: false, error: err?.message }, { status: 500 });
  }
}
