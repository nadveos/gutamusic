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

    const topic = searchParams.get('topic') || searchParams.get('type') || body.type || body.topic;
    const paymentId =
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      body?.data?.id ||
      body?.id;

    if (paymentId && (topic === 'payment' || !topic)) {
      // Procesar en segundo plano sin demorar la respuesta 200 a Mercado Pago
      processMercadoPagoPayment(paymentId).catch((err) => {
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
