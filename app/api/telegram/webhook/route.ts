import { NextRequest, NextResponse } from 'next/server';
import {
  answerTelegramCallbackQuery,
  editTelegramMessageText,
  sendTelegramMessage,
} from '@/lib/services/telegramService';
import { updateApplicationStatus } from '@/lib/services/applicationService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1. Manejo de mensajes de texto (ej. /start, /id)
    if (update.message) {
      const msg = update.message;
      const text = (msg.text || '').trim();
      const chatId = msg.chat?.id;
      const fromUser = msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name || 'Admin');

      if (text.startsWith('/start') || text.startsWith('/help')) {
        await sendTelegramMessage({
          chatId,
          text: [
            `👋 ¡Hola ${fromUser}!`,
            ``,
            `Soy el bot oficial de moderación de <b>GUTA MÚSICA</b>.`,
            ``,
            `📌 <b>Tu Chat ID es:</b> <code>${chatId}</code>`,
            ``,
            `A partir de ahora, cada vez que una banda o artista complete su postulación, te enviaré su ficha aquí mismo con botones para <b>Aprobar</b> o <b>Rechazar</b> en 1 toque.`,
          ].join('\n'),
          parseMode: 'HTML',
        });
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Manejo de botones interactivos (Inline Keyboards)
    if (update.callback_query) {
      const query = update.callback_query;
      const callbackQueryId = query.id;
      const data = query.data || '';
      const fromId = query.from?.id?.toString();
      const message = query.message;
      const chatId = message?.chat?.id;
      const messageId = message?.message_id;
      const adminName = query.from?.username ? `@${query.from.username}` : (query.from?.first_name || 'Admin');

      // Validar autorización (si está configurado TELEGRAM_CHAT_ID)
      const authorizedChatId = process.env.TELEGRAM_CHAT_ID;
      if (authorizedChatId && fromId !== authorizedChatId && chatId?.toString() !== authorizedChatId) {
        await answerTelegramCallbackQuery({
          callbackQueryId,
          text: '⛔ No tenés permisos para moderar postulaciones.',
          showAlert: true,
        });
        return NextResponse.json({ ok: true });
      }

      // Procesar acción de postulación (ej: "app:approve:abc123" o "app:reject:abc123")
      if (data.startsWith('app:')) {
        const [, action, appId] = data.split(':');

        if (!appId || (action !== 'approve' && action !== 'reject')) {
          await answerTelegramCallbackQuery({
            callbackQueryId,
            text: '⚠️ Acción no reconocida.',
            showAlert: true,
          });
          return NextResponse.json({ ok: true });
        }

        const isApproved = action === 'approve';
        const targetStatus = isApproved ? 'approved' : 'rejected';

        try {
          // Ejecutar aprobación / rechazo en base de datos, artista y correo
          await updateApplicationStatus({
            id: appId,
            status: targetStatus,
            adminName,
            reason: isApproved
              ? `Aprobada desde Telegram por ${adminName}`
              : `Rechazada desde Telegram por ${adminName}`,
          });

          // Avisar a Telegram que la acción se completó (quita el spinner del botón)
          await answerTelegramCallbackQuery({
            callbackQueryId,
            text: isApproved
              ? '✅ Postulación aprobada con éxito. Artista publicado y email enviado.'
              : '❌ Postulación rechazada.',
            showAlert: false,
          });

          // Actualizar el mensaje original en Telegram para reflejar el cambio y quitar botones de acción
          if (chatId && messageId) {
            const originalText = message.text || '';
            const statusBanner = isApproved
              ? `\n\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>ESTADO: APROBADA</b>\n👤 Por: ${adminName}\n📅 ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`
              : `\n\n━━━━━━━━━━━━━━━━━━━━\n❌ <b>ESTADO: RECHAZADA</b>\n👤 Por: ${adminName}\n📅 ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`;

            const updatedText = originalText + statusBanner;

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';
            await editTelegramMessageText({
              chatId,
              messageId,
              text: updatedText,
              parseMode: 'HTML',
              replyMarkup: {
                inline_keyboard: [
                  [
                    {
                      text: '🌐 Ver en Panel de Postulaciones',
                      url: `${siteUrl}/admin/postulaciones`,
                    },
                  ],
                ],
              },
            });
          }
        } catch (actionErr: any) {
          console.error('❌ Error al moderar postulación desde Telegram:', actionErr);
          await answerTelegramCallbackQuery({
            callbackQueryId,
            text: `❌ Error: ${actionErr.message || 'No se pudo procesar la postulación.'}`,
            showAlert: true,
          });
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('❌ Error en Telegram Webhook:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
