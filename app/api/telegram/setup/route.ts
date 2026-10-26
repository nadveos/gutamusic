import { NextRequest, NextResponse } from 'next/server';
import {
  getTelegramWebhookInfo,
  setupTelegramWebhook,
  sendTelegramMessage,
} from '@/lib/services/telegramService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/telegram/setup
 * Permite consultar el estado del bot, registrar el webhook o enviar un mensaje de prueba.
 * Parámetros opcionales en la URL:
 *   ?action=set_webhook   -> Configura el webhook apuntando a /api/telegram/webhook
 *   ?action=test_message  -> Envía un mensaje de prueba al chat configurado
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';
  const webhookUrl = `${siteUrl}/api/telegram/webhook`;

  if (action === 'set_webhook') {
    const result = await setupTelegramWebhook(webhookUrl);
    const info = await getTelegramWebhookInfo();
    return NextResponse.json({
      success: true,
      action: 'set_webhook',
      webhookUrl,
      result,
      currentWebhookInfo: info,
    });
  }

  if (action === 'test_message') {
    const result = await sendTelegramMessage({
      text: [
        '🎸 <b>¡Prueba de conexión con GUTA MÚSICA!</b>',
        '',
        'El bot está correctamente configurado y listo para recibir postulaciones de artistas.',
        `📅 <i>${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</i>`,
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: '🌐 Abrir Portal Guta',
              url: siteUrl,
            },
          ],
        ],
      },
    });

    return NextResponse.json({
      success: result.success,
      action: 'test_message',
      result,
    });
  }

  // Por defecto retorna el estado actual del webhook
  const webhookInfo = await getTelegramWebhookInfo();

  return NextResponse.json({
    status: 'online',
    siteUrl,
    webhookTarget: webhookUrl,
    hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    hasChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
    configuredChatId: process.env.TELEGRAM_CHAT_ID,
    webhookInfo,
    instructions: {
      setWebhookUrl: `${siteUrl}/api/telegram/setup?action=set_webhook`,
      sendTestMessageUrl: `${siteUrl}/api/telegram/setup?action=test_message`,
    },
  });
}
