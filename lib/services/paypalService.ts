import { getServerAdminPb } from '../pocketbase';
import { sendTelegramMessage } from './telegramService';
import { AllianceSector } from '../types';
import { calculateExpirationDate, getPlanBySector } from '../constants/sponsorPricing';
import { saveContributionToDb } from './mercadopagoService';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

// Tipo de cambio de referencia USD -> ARS para estadísticas unificadas en el panel
const USD_TO_ARS_REFERENCE = 1200;

const globalForPayPal = globalThis as unknown as {
  __paypalProcessedOrders?: Set<string>;
  __paypalInFlightOrders?: Map<string, Promise<any>>;
  __paypalResolvedBaseUrl?: string;
};

const processedPayPalOrders =
  globalForPayPal.__paypalProcessedOrders ||
  (globalForPayPal.__paypalProcessedOrders = new Set<string>());
const inFlightPayPalOrders =
  globalForPayPal.__paypalInFlightOrders ||
  (globalForPayPal.__paypalInFlightOrders = new Map<string, Promise<any>>());

export interface CreatePayPalDonationParams {
  amountUsd: number;
  donorName?: string;
  donorEmail?: string;
  message?: string;
}

export interface CreatePayPalSponsorParams {
  allianceId: string;
  brandName: string;
  sector: AllianceSector;
  userEmail?: string;
  amountUsd?: number;
  amountArs?: number;
}

/**
 * Obtiene un Access Token OAuth2 de PayPal.
 * Soporta auto-detección entre entorno Live (api-m.paypal.com) y Sandbox (api-m.sandbox.paypal.com).
 */
async function getPayPalAuth(): Promise<{ accessToken: string; baseUrl: string }> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
    throw new Error('Credenciales PAYPAL_CLIENT_ID o PAYPAL_SECRET no configuradas en el servidor.');
  }

  const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID.trim()}:${PAYPAL_SECRET.trim()}`).toString('base64');

  const candidateUrls = globalForPayPal.__paypalResolvedBaseUrl
    ? [globalForPayPal.__paypalResolvedBaseUrl]
    : ['https://api-m.paypal.com', 'https://api-m.sandbox.paypal.com'];

  let lastError = 'Error autenticando con PayPal';

  for (const baseUrl of candidateUrls) {
    try {
      const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        globalForPayPal.__paypalResolvedBaseUrl = baseUrl;
        return { accessToken: data.access_token, baseUrl };
      }
      lastError = data.error_description || data.error || lastError;
    } catch (err: any) {
      lastError = err?.message || lastError;
    }
  }

  throw new Error(`No se pudo autenticar con PayPal API: ${lastError}`);
}

/**
 * Crea una orden de pago en PayPal (Orders v2) para una Colaboración Voluntaria en USD
 */
export async function createPayPalDonationOrder(params: CreatePayPalDonationParams) {
  const { accessToken, baseUrl } = await getPayPalAuth();
  const cleanUsd = Math.max(1, Number(params.amountUsd) || 5);
  const valueStr = cleanUsd.toFixed(2);

  const customMetadata = JSON.stringify({
    t: 'donation',
    usd: cleanUsd,
    n: (params.donorName || '').slice(0, 35),
  });

  const returnParams = new URLSearchParams({
    type: 'donation',
    usd: valueStr,
  });
  if (params.donorName) returnParams.set('name', params.donorName.slice(0, 50));

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: 'colaboracion_voluntaria_guta',
        custom_id: customMetadata,
        description: 'Colaboración Voluntaria — GUTA MÚSICA (Música Federal)',
        amount: {
          currency_code: 'USD',
          value: valueStr,
        },
      },
    ],
    application_context: {
      brand_name: 'GUTA MUSICA',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
      return_url: `${SITE_URL}/api/paypal/capture?${returnParams.toString()}`,
      cancel_url: `${SITE_URL}/?payment=failure`,
    },
  };

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error creando orden de donación en PayPal:', data);
    throw new Error(data.message || 'No se pudo generar la orden de pago en PayPal');
  }

  const approveLink = (data.links || []).find(
    (l: any) => l.rel === 'approve' || l.rel === 'payer-action'
  );

  return {
    orderId: data.id,
    approveUrl: approveLink?.href || '',
  };
}

/**
 * Crea una orden de pago en PayPal (Orders v2) para Contratación o Renovación de Auspicio (30 días)
 */
export async function createPayPalSponsorOrder(params: CreatePayPalSponsorParams) {
  const { accessToken, baseUrl } = await getPayPalAuth();
  const plan = getPlanBySector(params.sector);
  const usdPrice = params.amountUsd || plan.priceUsd || 25;
  const arsPrice = params.amountArs || plan.priceArs || 29500;
  const valueStr = Number(usdPrice).toFixed(2);

  const customMetadata = JSON.stringify({
    t: 'sponsor',
    aid: params.allianceId,
    s: params.sector,
    usd: usdPrice,
    ars: arsPrice,
  });

  const returnParams = new URLSearchParams({
    type: 'sponsor_alliance',
    allianceId: params.allianceId,
    sector: params.sector,
    usd: valueStr,
    ars: String(arsPrice),
  });

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: `sponsor_${params.allianceId}`,
        custom_id: customMetadata,
        description: `Auspicio Cultural (30 días) — ${params.brandName} (${plan.name})`,
        amount: {
          currency_code: 'USD',
          value: valueStr,
        },
      },
    ],
    application_context: {
      brand_name: 'GUTA MUSICA',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
      return_url: `${SITE_URL}/api/paypal/capture?${returnParams.toString()}`,
      cancel_url: `${SITE_URL}/panel-auspiciante?payment=failure&id=${params.allianceId}`,
    },
  };

  const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ Error creando orden de auspicio en PayPal:', data);
    throw new Error(data.message || 'No se pudo generar la orden de auspicio en PayPal');
  }

  const approveLink = (data.links || []).find(
    (l: any) => l.rel === 'approve' || l.rel === 'payer-action'
  );

  return {
    orderId: data.id,
    approveUrl: approveLink?.href || '',
  };
}

/**
 * Captura una orden aprobada de PayPal y procesa su activación (Donación o Auspicio)
 * con doble barrera de idempotencia para evitar notificaciones duplicadas en Telegram.
 */
export async function captureAndProcessPayPalOrder(
  orderId: string,
  hints?: {
    type?: string;
    allianceId?: string;
    sector?: string;
    usd?: string | number;
    ars?: string | number;
    name?: string;
  }
) {
  const cleanOrderId = String(orderId || '').trim();
  if (!cleanOrderId) {
    return { success: false, error: 'Falta orderId de PayPal' };
  }

  if (processedPayPalOrders.has(cleanOrderId)) {
    return { success: true, deduplicated: true };
  }

  const inFlight = inFlightPayPalOrders.get(cleanOrderId);
  if (inFlight) {
    return inFlight;
  }

  const executionPromise = (async () => {
    try {
      const { accessToken, baseUrl } = await getPayPalAuth();

      // 1. Intentar capturar la orden en PayPal
      let orderData: any = null;
      const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${cleanOrderId}/capture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (captureRes.ok) {
        orderData = await captureRes.json();
      } else {
        // Si ya había sido capturada, consultar el estado actual de la orden
        const getRes = await fetch(`${baseUrl}/v2/checkout/orders/${cleanOrderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (getRes.ok) {
          orderData = await getRes.json();
        } else {
          const errBody = await captureRes.json().catch(() => ({}));
          console.error(`❌ Error al capturar orden PayPal ${cleanOrderId}:`, errBody);
          return { success: false, error: errBody?.message || 'No se pudo capturar el pago en PayPal' };
        }
      }

      if (!orderData || orderData.status !== 'COMPLETED') {
        return { success: false, status: orderData?.status || 'UNKNOWN' };
      }

      const unit = orderData.purchase_units?.[0] || {};
      const captureObj = unit.payments?.captures?.[0] || {};
      const captureId = String(captureObj.id || cleanOrderId);

      // Parsear custom_id si existe
      let customMeta: any = {};
      const rawCustom = captureObj.custom_id || unit.custom_id;
      if (rawCustom && typeof rawCustom === 'string') {
        try {
          customMeta = JSON.parse(rawCustom);
        } catch {}
      }

      const paymentType =
        hints?.type ||
        (customMeta.t === 'sponsor' ? 'sponsor_alliance' : customMeta.t) ||
        'donation';

      const usdAmount =
        Number(captureObj.amount?.value || unit.amount?.value || customMeta.usd || hints?.usd) || 5;

      const payerGiven = orderData.payer?.name?.given_name || '';
      const payerSurname = orderData.payer?.name?.surname || '';
      const payerFullName = [payerGiven, payerSurname].filter(Boolean).join(' ').trim();
      const payerEmail = orderData.payer?.email_address || '';

      processedPayPalOrders.add(cleanOrderId);
      processedPayPalOrders.add(captureId);

      const pb = await getServerAdminPb();

      // CASO 1: Auspiciante / Alianza Publicitaria (30 días)
      if (paymentType === 'sponsor_alliance') {
        const allianceId = hints?.allianceId || customMeta.aid;
        const sector = (hints?.sector || customMeta.s || 'home_mid') as AllianceSector;
        const plan = getPlanBySector(sector);
        const arsAmount = Number(hints?.ars || customMeta.ars || plan.priceArs);

        if (allianceId) {
          const existingAlliance = await pb.collection('alliances').getOne(allianceId).catch(() => null);
          if (existingAlliance && existingAlliance.paymentId === captureId && existingAlliance.active) {
            return { success: true, deduplicated: true, paymentType, allianceId };
          }

          const todayIso = new Date().toISOString().split('T')[0];
          const endDateIso = calculateExpirationDate(new Date());

          await pb.collection('alliances').update(allianceId, {
            active: true,
            paymentStatus: 'active',
            startDate: todayIso,
            endDate: endDateIso,
            pricePaid: arsAmount,
            paymentId: `PP-${captureId}`,
          });

          const brandName = existingAlliance?.name || allianceId;

          await sendTelegramMessage({
            text: [
              `🎉 <b>¡NUEVO AUSPICIO ACTIVADO VÍA PAYPAL (30 DÍAS)!</b>`,
              ``,
              `🏢 <b>Marca / Auspiciante:</b> <code>${brandName}</code>`,
              `📍 <b>Sección Web:</b> ${plan.name} (<code>${sector}</code>)`,
              `💵 <b>Monto cobrado:</b> <b>US$ ${usdAmount.toFixed(2)} USD</b> (~$${arsAmount.toLocaleString('es-AR')} ARS)`,
              `📅 <b>Fecha de inicio:</b> ${todayIso}`,
              `⏱️ <b>Vigencia hasta:</b> ${endDateIso} (30 días corridos)`,
              ``,
              `<i>ID Pago PayPal: <code>${captureId}</code></i>`,
            ].join('\n'),
            parseMode: 'HTML',
          });

          return { success: true, paymentType: 'sponsor_alliance', allianceId, usdAmount };
        }
      }

      // CASO 2: Colaboración Voluntaria (Donación)
      const donorName = hints?.name || customMeta.n || payerFullName || 'Anónimo';
      const arsEquivalent = Math.round(usdAmount * USD_TO_ARS_REFERENCE);

      const { created } = await saveContributionToDb(
        {
          paymentId: `PP-${captureId}`,
          amount: arsEquivalent,
          netAmount: arsEquivalent,
          donorName,
          donorEmail: payerEmail,
          message: `Aporte vía PayPal: US$ ${usdAmount.toFixed(2)} USD`,
          status: 'approved',
          paymentMethod: `PayPal (US$ ${usdAmount.toFixed(2)})`,
          paymentType: 'donation',
          date: captureObj.create_time || new Date().toISOString(),
        },
        pb
      );

      if (created) {
        await sendTelegramMessage({
          text: [
            `💙 <b>¡NUEVA COLABORACIÓN VOLUNTARIA (PAYPAL)!</b>`,
            ``,
            `💵 <b>Aporte recibido:</b> <b>US$ ${usdAmount.toFixed(2)} USD</b> (~$${arsEquivalent.toLocaleString('es-AR')} ARS)`,
            `👤 <b>De:</b> ${donorName}`,
            payerEmail ? `📧 <b>Email:</b> ${payerEmail}` : null,
            ``,
            `¡Gracias por impulsar la música federal en GUTA!`,
            `<i>ID Pago PayPal: <code>${captureId}</code></i>`,
          ]
            .filter(Boolean)
            .join('\n'),
          parseMode: 'HTML',
        });
      }

      return { success: true, paymentType: 'donation', usdAmount, captureId };
    } catch (err: any) {
      processedPayPalOrders.delete(cleanOrderId);
      console.error('❌ Error procesando captura de PayPal:', err);
      return { success: false, error: err?.message || 'Error interno al procesar pago de PayPal' };
    } finally {
      inFlightPayPalOrders.delete(cleanOrderId);
    }
  })();

  inFlightPayPalOrders.set(cleanOrderId, executionPromise);
  return executionPromise;
}
