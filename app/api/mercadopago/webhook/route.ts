import { NextRequest, NextResponse } from 'next/server';
import { processMercadoPagoPayment } from '@/lib/services/mercadopagoService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const topic =
      searchParams.get('topic') ||
      searchParams.get('type') ||
      body?.type ||
      body?.topic ||
      (typeof body?.action === 'string' && body.action.startsWith('payment.') ? 'payment' : '');

    const paymentId =
      searchParams.get('data.id') ||
      (topic === 'payment' ? searchParams.get('id') : null) ||
      body?.data?.id ||
      (topic === 'payment' ? body?.id : null);

    // Procesar únicamente notificaciones de tipo 'payment' (con barrera de idempotencia en mercadopagoService)
    if (paymentId && (topic === 'payment' || !topic)) {
      await processMercadoPagoPayment(paymentId).catch((err) => {
        console.error('Error procesando pago MP en webhook:', err);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error en webhook de Mercado Pago:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'Mercado Pago Webhook Online' });
}
