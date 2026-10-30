import { NextRequest, NextResponse } from 'next/server';
import { captureAndProcessPayPalOrder } from '@/lib/services/paypalService';
import { sendTelegramMessage } from '@/lib/services/telegramService';

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
      const result = await captureAndProcessPayPalOrder(orderId).catch((err) => {
        console.error('Error procesando orden PayPal en webhook:', err);
        return { success: false, error: err?.message };
      });

      // Si el evento vino desde el "Webhook Simulator" de PayPal (el ID simulado no existe en la API real),
      // enviamos un aviso de prueba a Telegram sin ensuciar la base de datos de colaboraciones reales.
      if (!result?.success && eventType) {
        await sendTelegramMessage({
          text: [
            `🧪 <b>¡PRUEBA DE WEBHOOK PAYPAL EXITOSA!</b>`,
            ``,
            `✅ El servidor de <b>GUTA MÚSICA</b> recibió correctamente la señal desde PayPal.`,
            `📡 <b>Evento recibido:</b> <code>${eventType}</code>`,
            `🆔 <b>ID de prueba:</b> <code>${orderId}</code>`,
            ``,
            `<i>(Al ser una simulación de PayPal, no se agregó como cobro real en el historial de Admin).</i>`,
          ].join('\n'),
          parseMode: 'HTML',
        });
      }
    }

    return NextResponse.json({ ok: true, receivedEvent: eventType || 'custom' });
  } catch (err: any) {
    console.error('❌ Error en Webhook de PayPal:', err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'PayPal Webhook Online' });
}
