import { NextRequest, NextResponse } from 'next/server';
import { sendContactInquiryEmail } from '@/lib/services/emailService';
import { notifyNewContactInquiry } from '@/lib/services/telegramService';

export const dynamic = 'force-dynamic';

const CATEGORY_LABELS: Record<string, string> = {
  comercial: 'Consultas Comerciales & Auspicios',
  prensa: 'Prensa, Notas & Difusión',
  general: 'Consultas & Dudas Generales',
  soporte: 'Asistencia Personalizada al Artista',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();
    const projectOrCompany = (body.projectOrCompany || '').trim();
    const category = ['comercial', 'prensa', 'general', 'soporte'].includes(body.category)
      ? (body.category as 'comercial' | 'prensa' | 'general' | 'soporte')
      : 'general';
    const message = (body.message || '').trim();

    if (!name || !email || !email.includes('@') || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Por favor completá tu nombre, correo electrónico válido y el mensaje.',
        },
        { status: 400 }
      );
    }

    const ticketId = `GUTA-${Math.floor(10000 + Math.random() * 90000)}`;
    const categoryLabel = CATEGORY_LABELS[category] || 'Consultas Generales';
    const targetInbox =
      category === 'soporte' ? 'soporte@guta.musica.ar' : 'contacto@guta.musica.ar';

    await Promise.all([
      sendContactInquiryEmail({
        name,
        email,
        phone,
        projectOrCompany,
        category,
        categoryLabel,
        message,
        ticketId,
      }).catch((err) => {
        console.warn('Error enviando email de contacto:', err);
        return null;
      }),
      notifyNewContactInquiry({
        ticketId,
        name,
        email,
        phone,
        projectOrCompany,
        category,
        categoryLabel,
        targetInbox,
        message,
      }).catch((err) => {
        console.warn('Error enviando notificación de contacto por Telegram:', err);
        return null;
      }),
    ]);

    return NextResponse.json({
      success: true,
      ticketId,
      targetInbox,
      message: 'Tu consulta ha sido enviada correctamente.',
    });
  } catch (err: any) {
    console.error('❌ Error en POST /api/contacto:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error al procesar tu consulta.',
      },
      { status: 500 }
    );
  }
}
