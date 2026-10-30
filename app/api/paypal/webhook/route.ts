import { NextRequest, NextResponse } from 'next/server';
import { captureAndProcessPayPalOrder } from '@/lib/services/paypalService';

export const dynamic = 'force-dynamic';

/**
 * Webhook oficial para eventos de PayPal:
 * URL a configurar en PayPal Developer: https://guta.meapp.com.ar/api/paypal/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventType = body?.event_type || '';
    const resource = body?.resource || {};

    let orderId = '';

    // 1. Cuando el comprador aprueba la orden en PayPal
    if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'CHECKOUT.ORDER.COMPLETED') {
      orderId = resource.id;
    }
    // 2. Cuando la captura del pago se completa
    else if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      orderId = resource?.supplementary_data?.related_ids?.order_id || resource.id;
    }
    // 3. Fallback directo
    else if (body?.orderId || body?.token) {
      orderId = body.orderId || body.token;
    }

    if (orderId) {
      await captureAndProcessPayPalOrder(orderId).catch((err) => {
        console.error('Error procesando orden PayPal en webhook:', err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('❌ Error en Webhook de PayPal:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'PayPal Webhook Online' });
}
