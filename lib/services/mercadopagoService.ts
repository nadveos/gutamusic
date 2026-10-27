import { getServerAdminPb } from '../pocketbase';
import { sendTelegramMessage } from './telegramService';
import { AllianceSector } from '../types';
import { calculateExpirationDate, getPlanBySector } from '../constants/sponsorPricing';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

export interface CreateDonationParams {
  amount: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface CreateWeeklyFeaturedParams {
  artistId: string;
  artistName: string;
  userEmail?: string;
  amount?: number; // Precio por semana (default: $15.000 ARS)
}

export interface CreateSponsorAllianceParams {
  allianceId: string;
  brandName: string;
  sector: AllianceSector;
  userEmail?: string;
  amount?: number;
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro para una donación/colaboración voluntaria
 */
export async function createDonationPreference(params: CreateDonationParams) {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no configurado en el servidor');
  }

  const cleanAmount = Math.max(200, Math.round(Number(params.amount) || 1500));

  const body = {
    items: [
      {
        id: 'colaboracion_voluntaria',
        title: 'Colaboración Voluntaria — GUTA MÚSICA',
        description: 'Aporte al movimiento federal de música independiente argentina',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: cleanAmount,
      },
    ],
    payer: {
      name: (params.donorName || 'Colaborador Guta').trim(),
      email: (params.donorEmail || 'donacion@guta.meapp.com.ar').trim(),
    },
    back_urls: {
      success: `${SITE_URL}/?payment=success`,
      failure: `${SITE_URL}/?payment=failure`,
      pending: `${SITE_URL}/?payment=pending`,
    },
    auto_return: 'approved',
    notification_url: `${SITE_URL}/api/mercadopago/webhook`,
    metadata: {
      type: 'donation',
      amount: cleanAmount,
      donor_name: params.donorName || '',
      donor_message: params.message || '',
    },
    statement_descriptor: 'GUTA MUSICA',
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error de Mercado Pago API:', data);
    throw new Error(data.message || 'Error al generar link de pago con Mercado Pago');
  }

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

/**
 * Crea una preferencia de pago para destacar un artista por 7 días
 */
export async function createWeeklyFeaturedPreference(params: CreateWeeklyFeaturedParams) {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no configurado en el servidor');
  }

  const price = params.amount || 15000; // $15.000 ARS por 7 días de destaque en portada

  const body = {
    items: [
      {
        id: `destacado_${params.artistId}`,
        title: `Destaque Semanal (7 días) — ${params.artistName}`,
        description: 'Aparición prioritaria en el Hero principal y portada de GUTA MÚSICA por 7 días',
        quantity: 1,
        currency_id: 'ARS',
        unit_price: price,
      },
    ],
    payer: {
      email: (params.userEmail || 'artista@guta.meapp.com.ar').trim(),
    },
    back_urls: {
      success: `${SITE_URL}/panel-artista?payment=featured_success`,
      failure: `${SITE_URL}/panel-artista?payment=featured_failure`,
      pending: `${SITE_URL}/panel-artista?payment=featured_pending`,
    },
    auto_return: 'approved',
    notification_url: `${SITE_URL}/api/mercadopago/webhook`,
    metadata: {
      type: 'weekly_featured',
      artist_id: params.artistId,
      artist_name: params.artistName,
      amount: price,
    },
    statement_descriptor: 'GUTA MUSICA',
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error MP weekly featured preference:', data);
    throw new Error(data.message || 'Error al generar preferencia para destaque');
  }

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

/**
 * Crea una preferencia de pago para contratación o renovación de Auspicio de Marca por 30 días
 */
export async function createSponsorAlliancePreference(params: CreateSponsorAllianceParams) {
  if (!MP_ACCESS_TOKEN) {
    throw new Error('MP_ACCESS_TOKEN no configurado en el servidor');
  }

  const plan = getPlanBySector(params.sector);
  const price = params.amount || plan.priceArs;

  const body = {
    items: [
      {
        id: `sponsor_${params.allianceId}`,
        title: `Auspicio Cultural (30 días) — ${params.brandName}`,
        description: `Espacio publicitario: ${plan.name} (${params.sector}) por 30 días corridos en GUTA MÚSICA`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: price,
      },
    ],
    payer: {
      email: (params.userEmail || 'auspicios@guta.meapp.com.ar').trim(),
    },
    back_urls: {
      success: `${SITE_URL}/panel-auspiciante?payment=success&id=${params.allianceId}`,
      failure: `${SITE_URL}/panel-auspiciante?payment=failure&id=${params.allianceId}`,
      pending: `${SITE_URL}/panel-auspiciante?payment=pending&id=${params.allianceId}`,
    },
    auto_return: 'approved',
    notification_url: `${SITE_URL}/api/mercadopago/webhook`,
    metadata: {
      type: 'sponsor_alliance',
      alliance_id: params.allianceId,
      brand_name: params.brandName,
      sector: params.sector,
      amount: price,
    },
    statement_descriptor: 'GUTA MUSICA',
  };

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error MP sponsor alliance preference:', data);
    throw new Error(data.message || 'Error al generar link de pago para auspicio');
  }

  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

/**
 * Procesa la notificación del Webhook de Mercado Pago cuando un pago es aprobado
 */
export async function processMercadoPagoPayment(paymentId: string | number) {
  if (!MP_ACCESS_TOKEN) return { success: false, error: 'Sin access token' };

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
    });

    if (!res.ok) {
      console.error(`❌ No se pudo consultar pago ${paymentId} en Mercado Pago`);
      return { success: false };
    }

    const payment = await res.json();

    if (payment.status !== 'approved') {
      return { success: true, status: payment.status };
    }

    const metadata = payment.metadata || {};
    const paymentType = metadata.type;
    const amount = payment.transaction_amount || metadata.amount || 0;

    // 1. Caso Destaque Semanal ($$): Activar los 7 días automáticamente en PocketBase
    if (paymentType === 'weekly_featured' && metadata.artist_id) {
      const pb = await getServerAdminPb();
      const todayIso = new Date().toISOString().split('T')[0];

      try {
        await pb.collection('artists').update(metadata.artist_id, {
          featuredOfWeek: true,
          featuredOfWeekDate: todayIso,
        });

        // Notificar por Telegram al administrador
        await sendTelegramMessage({
          text: [
            `🎉 <b>¡NUEVO DESTAQUE SEMANAL PAGADO!</b>`,
            ``,
            `🎸 <b>Artista:</b> <code>${metadata.artist_name || metadata.artist_id}</code>`,
            `💰 <b>Monto cobrado:</b> $${amount} ARS`,
            `📅 <b>Fecha de inicio:</b> ${todayIso}`,
            `⏱️ <b>Vigencia:</b> 7 días corridos (desmarcado automático)`,
            ``,
            `<i>ID Pago MP: <code>${paymentId}</code></i>`,
          ].join('\n'),
          parseMode: 'HTML',
        });
      } catch (err: any) {
        console.error('❌ Error al activar destaque semanal tras pago MP:', err);
      }
    }

    // 2. Caso Auspiciante / Alianza Publicitaria (30 días de vigencia)
    if (paymentType === 'sponsor_alliance' && metadata.alliance_id) {
      const pb = await getServerAdminPb();
      const todayIso = new Date().toISOString().split('T')[0];
      const endDateIso = calculateExpirationDate(new Date());

      try {
        await pb.collection('alliances').update(metadata.alliance_id, {
          active: true,
          paymentStatus: 'active',
          startDate: todayIso,
          endDate: endDateIso,
          pricePaid: amount,
          paymentId: String(paymentId),
        });

        const plan = getPlanBySector(metadata.sector);

        // Notificar por Telegram al administrador
        await sendTelegramMessage({
          text: [
            `🎉 <b>¡NUEVO AUSPICIO DE MARCA ACTIVADO (30 DÍAS)!</b>`,
            ``,
            `🏢 <b>Marca / Auspiciante:</b> <code>${metadata.brand_name || metadata.alliance_id}</code>`,
            `📍 <b>Sección Web:</b> ${plan.name} (<code>${metadata.sector}</code>)`,
            `💰 <b>Monto cobrado:</b> <b>$${amount} ARS</b>`,
            `📅 <b>Fecha de inicio:</b> ${todayIso}`,
            `⏱️ <b>Vigencia hasta:</b> ${endDateIso} (30 días corridos)`,
            ``,
            `<i>ID Pago MP: <code>${paymentId}</code></i>`,
          ].join('\n'),
          parseMode: 'HTML',
        });
      } catch (err: any) {
        console.error('❌ Error al activar auspicio publicitario tras pago MP:', err);
      }
    }

    // 3. Caso Colaboración Voluntaria: Notificar por Telegram
    if (paymentType === 'donation') {
      const donorName = metadata.donor_name || payment.payer?.first_name || 'Anónimo';
      const donorMessage = metadata.donor_message;

      await sendTelegramMessage({
        text: [
          `💙 <b>¡NUEVA COLABORACIÓN VOLUNTARIA!</b>`,
          ``,
          `💰 <b>Aporte recibido:</b> <b>$${amount} ARS</b>`,
          `👤 <b>De:</b> ${donorName}`,
          donorMessage ? `📝 <b>Mensaje:</b> <i>"${donorMessage}"</i>` : null,
          ``,
          `¡Gracias por impulsar la música federal en GUTA!`,
          `<i>ID Pago MP: <code>${paymentId}</code></i>`,
        ]
          .filter(Boolean)
          .join('\n'),
        parseMode: 'HTML',
      });
    }

    return { success: true, paymentType, amount };
  } catch (err: any) {
    console.error('❌ Error al procesar pago de Mercado Pago:', err);
    return { success: false, error: err.message };
  }
}
