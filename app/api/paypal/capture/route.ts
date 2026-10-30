import { NextRequest, NextResponse } from 'next/server';
import { captureAndProcessPayPalOrder } from '@/lib/services/paypalService';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

/**
 * Endpoint de retorno (return_url) cuando el usuario aprueba el pago en PayPal.
 * PayPal redirige aquí con ?token=ORDER_ID&PayerID=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || searchParams.get('orderId') || '';
  const type = searchParams.get('type') || 'donation';
  const allianceId = searchParams.get('allianceId') || '';
  const sector = searchParams.get('sector') || '';
  const usd = searchParams.get('usd') || '';
  const ars = searchParams.get('ars') || '';
  const name = searchParams.get('name') || '';

  // Determinar URL base de redirección usando el host de la request o SITE_URL
  const origin = req.nextUrl?.origin || SITE_URL;

  if (!token) {
    const fallbackUrl =
      type === 'sponsor_alliance'
        ? `${origin}/panel-auspiciante?payment=failure${allianceId ? `&id=${allianceId}` : ''}`
        : `${origin}/?payment=failure`;
    return NextResponse.redirect(fallbackUrl);
  }

  const result = await captureAndProcessPayPalOrder(token, {
    type,
    allianceId,
    sector,
    usd,
    ars,
    name,
  });

  if (result.success) {
    if (type === 'sponsor_alliance' || result.paymentType === 'sponsor_alliance') {
      const targetAllianceId = allianceId || (result as any).allianceId || '';
      return NextResponse.redirect(
        `${origin}/panel-auspiciante?payment=success${targetAllianceId ? `&id=${targetAllianceId}` : ''}`
      );
    }
    return NextResponse.redirect(`${origin}/?payment=success`);
  }

  const failUrl =
    type === 'sponsor_alliance'
      ? `${origin}/panel-auspiciante?payment=failure${allianceId ? `&id=${allianceId}` : ''}`
      : `${origin}/?payment=failure`;
  return NextResponse.redirect(failUrl);
}

/**
 * Soporte para Webhook de PayPal (CHECKOUT.ORDER.APPROVED / PAYMENT.CAPTURE.COMPLETED)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = body?.event_type || '';
    const resource = body?.resource || {};

    let orderId = '';
    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      orderId = resource.id;
    } else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      orderId = resource?.supplementary_data?.related_ids?.order_id || resource.id;
    } else if (body?.orderId || body?.token) {
      orderId = body.orderId || body.token;
    }

    if (orderId) {
      await captureAndProcessPayPalOrder(orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('❌ Error en POST /api/paypal/capture:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
