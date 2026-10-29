/**
 * Servicio de integración con la API de Bots de Telegram para GUTA MÚSICA.
 * Permite notificar nuevas postulaciones y moderarlas interactivamente mediante Inline Keyboards.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

function escapeHtml(text: string = ''): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface ApplicationNotificationData {
  id: string;
  stageName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  genres?: string[] | string;
  city?: string;
  province?: string;
  country?: string;
  bio?: string;
  socials?: Record<string, string>;
  photoUrl?: string;
  message?: string;
  referralSource?: string;
  submittedAt?: string;
}

/**
 * Envía un mensaje de texto formateado a Telegram usando el bot de Guta
 */
export async function sendTelegramMessage(params: {
  text: string;
  chatId?: string | number;
  replyMarkup?: any;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN no configurado. Se omite envío de Telegram.');
    return { success: false, error: 'TELEGRAM_BOT_TOKEN no configurado' };
  }

  const targetChatId = params.chatId || TELEGRAM_CHAT_ID;
  if (!targetChatId) {
    console.warn('⚠️ TELEGRAM_CHAT_ID no configurado. Se omite envío de Telegram.');
    return { success: false, error: 'TELEGRAM_CHAT_ID no configurado' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: params.text,
        parse_mode: params.parseMode || 'HTML',
        disable_web_page_preview: false,
        reply_markup: params.replyMarkup,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('❌ Error Telegram sendMessage:', data);
      return { success: false, error: data.description };
    }

    return { success: true, result: data.result };
  } catch (err: any) {
    console.error('❌ Error de conexión con Telegram API:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Responde a una pulsación de botón inline (callback query) para quitar el spinner en el cliente de Telegram
 */
export async function answerTelegramCallbackQuery(params: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}) {
  if (!TELEGRAM_BOT_TOKEN) return { success: false };

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: params.callbackQueryId,
        text: params.text,
        show_alert: params.showAlert ?? false,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('❌ Error answerCallbackQuery:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Actualiza el texto y teclado de un mensaje existente en Telegram
 */
export async function editTelegramMessageText(params: {
  chatId: string | number;
  messageId: number;
  text: string;
  replyMarkup?: any;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}) {
  if (!TELEGRAM_BOT_TOKEN) return { success: false };

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: params.chatId,
        message_id: params.messageId,
        text: params.text,
        parse_mode: params.parseMode || 'HTML',
        reply_markup: params.replyMarkup,
      }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('❌ Error editMessageText:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Notifica una nueva postulación de banda al chat de Telegram con botones inline
 */
export async function notifyNewApplication(app: ApplicationNotificationData) {
  const genresList = Array.isArray(app.genres)
    ? app.genres.join(', ')
    : (app.genres || 'No especificado');

  const socialsList: string[] = [];
  if (app.socials) {
    if (app.socials.spotify) socialsList.push(`• <b>Spotify:</b> <a href="${escapeHtml(app.socials.spotify)}">Abrir enlace</a>`);
    if (app.socials.instagram) socialsList.push(`• <b>Instagram:</b> <a href="${escapeHtml(app.socials.instagram)}">Abrir perfil</a>`);
    if (app.socials.youtube) socialsList.push(`• <b>YouTube:</b> <a href="${escapeHtml(app.socials.youtube)}">Ver canal</a>`);
    if (app.socials.tiktok) socialsList.push(`• <b>TikTok:</b> <a href="${escapeHtml(app.socials.tiktok)}">Ver perfil</a>`);
  }

  const locationParts = [app.city, app.province, app.country || 'Argentina'].filter(Boolean);
  const locationStr = locationParts.join(', ');

  const bioOrMessage = app.bio || app.message || 'Sin descripción provista.';
  const bioExcerpt = bioOrMessage.length > 300 ? bioOrMessage.slice(0, 297) + '...' : bioOrMessage;

  const referral = app.referralSource || app.socials?.referralSource || '';

  const html = [
    `<b>🎸 NUEVA POSTULACIÓN DE ARTISTA</b>`,
    ``,
    `<b>Banda / Artista:</b> <code>${escapeHtml(app.stageName)}</code>`,
    `<b>Contacto:</b> ${escapeHtml(app.contactName || 'No informado')} (${escapeHtml(app.email || 'Sin email')})`,
    app.phone ? `<b>Teléfono:</b> ${escapeHtml(app.phone)}` : null,
    locationStr ? `<b>Ubicación:</b> ${escapeHtml(locationStr)}` : null,
    `<b>Géneros:</b> ${escapeHtml(genresList)}`,
    referral ? `<b>📣 Nos conoció por:</b> ${escapeHtml(referral)}` : null,
    ``,
    `<b>Presentación / Bio:</b>`,
    `<blockquote>${escapeHtml(bioExcerpt)}</blockquote>`,
    socialsList.length > 0 ? `\n<b>Enlaces:</b>\n${socialsList.join('\n')}` : null,
    app.photoUrl ? `\n🖼 <a href="${escapeHtml(app.photoUrl)}">Ver Foto de Portada / Prensa</a>` : null,
    ``,
    `<i>ID: <code>${app.id}</code></i>`,
  ]
    .filter((line) => line !== null)
    .join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '✅ Aprobar', callback_data: `app:approve:${app.id}` },
        { text: '❌ Rechazar', callback_data: `app:reject:${app.id}` },
      ],
      [
        { text: '🌐 Ver en Panel Admin', url: `${SITE_URL}/admin/postulaciones` },
      ],
    ],
  };

  return sendTelegramMessage({
    text: html,
    replyMarkup,
    parseMode: 'HTML',
  });
}

/**
 * Configura o renueva el webhook de Telegram en la URL pública
 */
export async function setupTelegramWebhook(webhookUrl: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN no configurado' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtiene la información actual del webhook de Telegram
 */
export async function getTelegramWebhookInfo() {
  if (!TELEGRAM_BOT_TOKEN) return { success: false, error: 'TELEGRAM_BOT_TOKEN no configurado' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
