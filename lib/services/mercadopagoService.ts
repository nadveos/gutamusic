import { getServerAdminPb } from '../pocketbase';
import { sendTelegramMessage } from './telegramService';
import { AllianceSector, VoluntaryContribution } from '../types';
import { calculateExpirationDate, getPlanBySector } from '../constants/sponsorPricing';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

// Idempotencia en memoria (persiste entre invocaciones en el mismo proceso Node.js)
const globalForMp = globalThis as unknown as {
  __mpProcessedPayments?: Set<string>;
  __mpInFlightPayments?: Map<string, Promise<any>>;
  __donationsCollectionChecked?: boolean;
  __mpQrPosExternalId?: string;
};

const processedPayments =
  globalForMp.__mpProcessedPayments || (globalForMp.__mpProcessedPayments = new Set<string>());
const inFlightPayments =
  globalForMp.__mpInFlightPayments || (globalForMp.__mpInFlightPayments = new Map<string, Promise<any>>());

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
 * Asegura que la colección 'donations' exista en PocketBase.
 * Si no existe, la crea automáticamente con credenciales de superusuario.
 */
export async function ensureDonationsCollection(adminPb?: any): Promise<boolean> {
  if (globalForMp.__donationsCollectionChecked) return true;
  try {
    const pb = adminPb || (await getServerAdminPb());
    try {
      const existing = await pb.collections.getOne('donations');
      if (existing) {
        globalForMp.__donationsCollectionChecked = true;
        return true;
      }
    } catch {
      // No existe aún, procedemos a crearla
    }

    const collectionData = {
      name: 'donations',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.id != ""',
      deleteRule: '@request.auth.id != ""',
      fields: [
        { name: 'paymentId', type: 'text', required: true },
        { name: 'amount', type: 'number', required: false },
        { name: 'netAmount', type: 'number', required: false },
        { name: 'donorName', type: 'text', required: false },
        { name: 'donorEmail', type: 'text', required: false },
        { name: 'message', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
        { name: 'paymentMethod', type: 'text', required: false },
        { name: 'paymentType', type: 'text', required: false },
        { name: 'date', type: 'text', required: false },
      ],
    };

    try {
      await pb.collections.create(collectionData);
      globalForMp.__donationsCollectionChecked = true;
      return true;
    } catch {
      const fallbackSchema = {
        name: 'donations',
        type: 'base',
        listRule: '',
        viewRule: '',
        schema: [
          { name: 'paymentId', type: 'text', required: true },
          { name: 'amount', type: 'number' },
          { name: 'netAmount', type: 'number' },
          { name: 'donorName', type: 'text' },
          { name: 'donorEmail', type: 'text' },
          { name: 'message', type: 'text' },
          { name: 'status', type: 'text' },
          { name: 'paymentMethod', type: 'text' },
          { name: 'paymentType', type: 'text' },
          { name: 'date', type: 'text' },
        ],
      };
      await pb.collections.create(fallbackSchema);
      globalForMp.__donationsCollectionChecked = true;
      return true;
    }
  } catch (err: any) {
    console.warn('⚠️ No se pudo verificar/crear colección donations, usando fallback site_settings:', err?.message);
    return false;
  }
}

/**
 * Verifica si un paymentId ya fue procesado y registrado en PocketBase
 */
async function isPaymentAlreadyProcessedInDb(pb: any, paymentId: string): Promise<boolean> {
  const cleanId = String(paymentId).trim();
  if (!cleanId) return false;
  if (processedPayments.has(cleanId)) return true;

  try {
    await ensureDonationsCollection(pb);
    const existing = await pb.collection('donations').getFirstListItem(`paymentId="${cleanId}"`, {
      requestKey: null,
    });
    if (existing) {
      processedPayments.add(cleanId);
      return true;
    }
  } catch {}

  // Verificar también en site_settings (fallback o log de pagos procesados)
  try {
    const settingsRec = await pb.collection('site_settings').getFirstListItem('key="donations_history"', {
      requestKey: null,
    });
    if (settingsRec?.data) {
      const list: VoluntaryContribution[] =
        typeof settingsRec.data === 'string' ? JSON.parse(settingsRec.data) : settingsRec.data;
      if (Array.isArray(list) && list.some((item) => String(item.paymentId) === cleanId)) {
        processedPayments.add(cleanId);
        return true;
      }
    }
  } catch {}

  // Verificar si ya fue procesado como alianza
  try {
    const existingAlliance = await pb.collection('alliances').getFirstListItem(`paymentId="${cleanId}"`, {
      requestKey: null,
    });
    if (existingAlliance) {
      processedPayments.add(cleanId);
      return true;
    }
  } catch {}

  return false;
}

/**
 * Guarda una colaboración en PocketBase (colección 'donations' + respaldo en 'site_settings').
 * Retorna `{ created: boolean, record: VoluntaryContribution }`.
 */
export async function saveContributionToDb(
  contribution: Omit<VoluntaryContribution, 'id'>,
  adminPb?: any
): Promise<{ created: boolean; record: VoluntaryContribution }> {
  const pb = adminPb || (await getServerAdminPb());
  const cleanId = String(contribution.paymentId).trim();

  await ensureDonationsCollection(pb);

  // 1. Intentar en colección 'donations'
  try {
    try {
      const existing = await pb.collection('donations').getFirstListItem(`paymentId="${cleanId}"`, {
        requestKey: null,
      });
      if (existing) {
        processedPayments.add(cleanId);
        return {
          created: false,
          record: mapRecordToContribution(existing),
        };
      }
    } catch {
      // No existe, lo creamos
    }

    const createdRecord = await pb.collection('donations').create(
      {
        paymentId: cleanId,
        amount: Number(contribution.amount) || 0,
        netAmount: Number(contribution.netAmount ?? contribution.amount) || 0,
        donorName: contribution.donorName || 'Anónimo',
        donorEmail: contribution.donorEmail || '',
        message: contribution.message || '',
        status: contribution.status || 'approved',
        paymentMethod: contribution.paymentMethod || 'Mercado Pago',
        paymentType: contribution.paymentType || 'donation',
        date: contribution.date || new Date().toISOString(),
      },
      { requestKey: null }
    );

    processedPayments.add(cleanId);
    return {
      created: true,
      record: mapRecordToContribution(createdRecord),
    };
  } catch (err: any) {
    console.warn('⚠️ Fallback a site_settings para guardar colaboración:', err?.message);
  }

  // 2. Fallback en 'site_settings' (key="donations_history")
  let existingRecord: any = null;
  let currentList: VoluntaryContribution[] = [];
  try {
    existingRecord = await pb.collection('site_settings').getFirstListItem('key="donations_history"', {
      requestKey: null,
    });
    if (existingRecord?.data) {
      const parsed =
        typeof existingRecord.data === 'string' ? JSON.parse(existingRecord.data) : existingRecord.data;
      if (Array.isArray(parsed)) currentList = parsed;
    }
  } catch {}

  const found = currentList.find((item) => String(item.paymentId) === cleanId);
  if (found) {
    processedPayments.add(cleanId);
    return { created: false, record: found };
  }

  const newEntry: VoluntaryContribution = {
    id: `don_${cleanId}_${Date.now()}`,
    paymentId: cleanId,
    amount: Number(contribution.amount) || 0,
    netAmount: Number(contribution.netAmount ?? contribution.amount) || 0,
    donorName: contribution.donorName || 'Anónimo',
    donorEmail: contribution.donorEmail || '',
    message: contribution.message || '',
    status: contribution.status || 'approved',
    paymentMethod: contribution.paymentMethod || 'Mercado Pago',
    paymentType: contribution.paymentType || 'donation',
    date: contribution.date || new Date().toISOString(),
  };

  const updatedList = [newEntry, ...currentList];
  const payload = {
    key: 'donations_history',
    data: JSON.stringify(updatedList),
  };

  if (existingRecord?.id) {
    await pb.collection('site_settings').update(existingRecord.id, payload, { requestKey: null });
  } else {
    await pb.collection('site_settings').create(payload, { requestKey: null });
  }

  processedPayments.add(cleanId);
  return { created: true, record: newEntry };
}

function mapRecordToContribution(r: any): VoluntaryContribution {
  return {
    id: r.id,
    paymentId: String(r.paymentId || ''),
    amount: Number(r.amount) || 0,
    netAmount: Number(r.netAmount || r.amount) || 0,
    donorName: r.donorName || 'Anónimo',
    donorEmail: r.donorEmail || '',
    message: r.message || '',
    status: r.status || 'approved',
    paymentMethod: r.paymentMethod || 'Mercado Pago',
    paymentType: r.paymentType || 'donation',
    date: r.date || r.created || new Date().toISOString(),
    created: r.created,
  };
}

/**
 * Obtiene todo el historial de colaboraciones voluntarias almacenadas en PocketBase
 */
export async function getContributionsFromDb(adminPb?: any): Promise<VoluntaryContribution[]> {
  const pb = adminPb || (await getServerAdminPb());
  await ensureDonationsCollection(pb);

  const byPaymentId = new Map<string, VoluntaryContribution>();

  try {
    const records: any[] = await pb.collection('donations').getFullList({
      requestKey: null,
    });
    for (const r of records) {
      const mapped = mapRecordToContribution(r);
      byPaymentId.set(mapped.paymentId || mapped.id, mapped);
    }
  } catch {}

  try {
    const settingsRec = await pb.collection('site_settings').getFirstListItem('key="donations_history"', {
      requestKey: null,
    });
    if (settingsRec?.data) {
      const list: VoluntaryContribution[] =
        typeof settingsRec.data === 'string' ? JSON.parse(settingsRec.data) : settingsRec.data;
      if (Array.isArray(list)) {
        for (const item of list) {
          const key = item.paymentId || item.id;
          if (!byPaymentId.has(key)) {
            byPaymentId.set(key, item);
          }
        }
      }
    }
  } catch {}

  return Array.from(byPaymentId.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Extrae los datos limpios de un objeto payment de Mercado Pago
 */
function extractDonationFromMpPayment(payment: any): Omit<VoluntaryContribution, 'id'> {
  const metadata = payment.metadata || {};
  const amount = Number(payment.transaction_amount || metadata.amount || 0);
  const netAmount = Number(payment.transaction_details?.net_received_amount || amount);

  const payerFullName = [payment.payer?.first_name, payment.payer?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const additionalPayerName = [
    payment.additional_info?.payer?.first_name,
    payment.additional_info?.payer?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  const cardholderName = payment.card?.cardholder?.name?.trim() || '';

  let rawDonorName =
    metadata.donor_name ||
    payerFullName ||
    additionalPayerName ||
    cardholderName ||
    'Anónimo';

  if (rawDonorName.toLowerCase() === 'colaborador guta') {
    rawDonorName = 'Anónimo';
  }

  const rawEmail = metadata.donor_email || payment.payer?.email || '';
  const donorEmail =
    rawEmail && !rawEmail.includes('donacion@guta.meapp.com.ar') ? rawEmail : '';

  const methodMap: Record<string, string> = {
    account_money: 'Dinero en cuenta MP',
    credit_card: 'Tarjeta de Crédito',
    debit_card: 'Tarjeta de Débito',
    bank_transfer: 'Transferencia / CVU',
    ticket: 'Efectivo (Rapipago / PagoFácil)',
    prepaid_card: 'Tarjeta Prepaga',
  };

  const paymentTypeId = payment.payment_type_id || '';
  const paymentMethodId = payment.payment_method_id || '';
  const paymentMethod =
    methodMap[paymentTypeId] ||
    (paymentMethodId ? `Mercado Pago (${paymentMethodId.toUpperCase()})` : 'Mercado Pago');

  return {
    paymentId: String(payment.id),
    amount,
    netAmount,
    donorName: rawDonorName,
    donorEmail,
    message: metadata.donor_message || '',
    status: payment.status || 'approved',
    paymentMethod,
    paymentType: metadata.type || 'donation',
    date: payment.date_approved || payment.date_created || new Date().toISOString(),
  };
}

/**
 * Sincroniza colaboraciones aprobadas directamente desde la API de Mercado Pago
 * hacia PocketBase (sin re-enviar notificaciones de Telegram).
 */
export async function syncMercadoPagoDonations(specificPaymentIds: string[] = ['185782556551']): Promise<{
  syncedCount: number;
  total: number;
  contributions: VoluntaryContribution[];
}> {
  const pb = await getServerAdminPb();
  await ensureDonationsCollection(pb);

  let syncedCount = 0;

  if (MP_ACCESS_TOKEN) {
    // 1. Verificar IDs específicos (ej. el primer aporte histórico 185782556551)
    for (const pid of specificPaymentIds) {
      try {
        const cleanPid = String(pid).trim();
        if (!cleanPid) continue;
        const alreadyExists = await isPaymentAlreadyProcessedInDb(pb, cleanPid);
        if (!alreadyExists) {
          const res = await fetch(`https://api.mercadopago.com/v1/payments/${cleanPid}`, {
            headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
          });
          if (res.ok) {
            const payment = await res.json();
            if (payment && payment.id && payment.status === 'approved') {
              const extracted = extractDonationFromMpPayment(payment);
              const { created } = await saveContributionToDb(extracted, pb);
              if (created) syncedCount++;
            }
          }
        }
      } catch (err) {
        console.warn(`Error sincronizando pago específico ${pid}:`, err);
      }
    }

    // 2. Consultar los últimos pagos aprobados en la cuenta de Mercado Pago
    try {
      const searchUrl =
        'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&status=approved&limit=50';
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = Array.isArray(searchData.results) ? searchData.results : [];

        for (const payment of results) {
          const metadata = payment.metadata || {};
          const items = payment.additional_info?.items || [];
          const isGutaDonation =
            metadata.type === 'donation' ||
            items.some((it: any) => it.id === 'colaboracion_voluntaria') ||
            (payment.description &&
              payment.description.toLowerCase().includes('colaboración voluntaria'));

          if (isGutaDonation && payment.status === 'approved') {
            const extracted = extractDonationFromMpPayment(payment);
            const { created } = await saveContributionToDb(extracted, pb);
            if (created) syncedCount++;
          }
        }
      }
    } catch (err) {
      console.warn('Error buscando pagos recientes en Mercado Pago:', err);
    }
  }

  const contributions = await getContributionsFromDb(pb);
  return {
    syncedCount,
    total: contributions.length,
    contributions,
  };
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
      donor_email: params.donorEmail || '',
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
  const externalReference = `sponsor_alliance|${params.allianceId}|${params.sector}|${params.brandName}`;

  const body = {
    external_reference: externalReference,
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
    externalReference,
  };
}

/**
 * Obtiene el Collector ID (User ID) de la cuenta de Mercado Pago a partir del token o /users/me
 */
async function getMercadoPagoCollectorId(): Promise<string> {
  if (!MP_ACCESS_TOKEN) throw new Error('MP_ACCESS_TOKEN no configurado');
  const parts = MP_ACCESS_TOKEN.trim().split('-');
  const lastPart = parts[parts.length - 1];
  if (lastPart && /^\d+$/.test(lastPart)) {
    return lastPart;
  }

  const res = await fetch('https://api.mercadopago.com/users/me', {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!res.ok) {
    throw new Error('No se pudo obtener el collector_id de Mercado Pago');
  }
  const data = await res.json();
  return String(data.id);
}

/**
 * Asegura que exista una Sucursal (Store) y Caja (POS) virtual en la cuenta de Mercado Pago
 * para poder emitir códigos QR Dinámicos Interoperables (EMVCo / Transferencia 3.0)
 * compatibles con GOcuotas, Naranja X, MODO, Ualá, Personal Pay, Cuenta DNI y Mercado Pago.
 */
async function ensureMercadoPagoQrPos(collectorId: string): Promise<string> {
  const externalStoreId = 'GUTASTORE01';
  const externalPosId = 'GUTAPOS01';

  if (globalForMp.__mpQrPosExternalId) {
    return globalForMp.__mpQrPosExternalId;
  }

  // 1. Verificar si la caja (POS) ya existe
  try {
    const posCheckRes = await fetch(
      `https://api.mercadopago.com/pos?external_id=${externalPosId}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      }
    );
    if (posCheckRes.ok) {
      const posCheckData = await posCheckRes.json();
      if (Array.isArray(posCheckData.results) && posCheckData.results.length > 0) {
        globalForMp.__mpQrPosExternalId = externalPosId;
        return externalPosId;
      }
    }
  } catch (err) {
    console.warn('Error consultando POS existente en MP:', err);
  }

  // 2. Buscar o crear la Sucursal (Store)
  let storeId: string | number | null = null;
  try {
    const storeSearchRes = await fetch(
      `https://api.mercadopago.com/users/${collectorId}/stores/search?external_id=${externalStoreId}`,
      {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
      }
    );
    if (storeSearchRes.ok) {
      const storeSearchData = await storeSearchRes.json();
      if (Array.isArray(storeSearchData.results) && storeSearchData.results.length > 0) {
        storeId = storeSearchData.results[0].id;
      }
    }
  } catch {}

  if (!storeId) {
    const createStoreRes = await fetch(
      `https://api.mercadopago.com/users/${collectorId}/stores`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'GUTA MUSICA WEB',
          external_id: externalStoreId,
          location: {
            street_number: '100',
            street_name: 'Caseros',
            city_name: 'Salta',
            state_name: 'Salta',
            latitude: -24.7891,
            longitude: -65.4103,
            reference: 'Plataforma Federal GUTA MUSICA',
          },
        }),
      }
    );

    if (createStoreRes.ok) {
      const createdStore = await createStoreRes.json();
      storeId = createdStore.id;
    } else {
      const errStore = await createStoreRes.json().catch(() => ({}));
      console.warn('Aviso al crear Store MP para QR:', errStore);
    }
  }

  // 3. Crear la Caja (POS) asociada a la sucursal
  const posPayload: Record<string, any> = {
    name: 'Caja Web GUTA QR',
    fixed_amount: true,
    external_store_id: externalStoreId,
    external_id: externalPosId,
  };
  if (storeId) {
    posPayload.store_id = Number(storeId);
  }

  const createPosRes = await fetch('https://api.mercadopago.com/pos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(posPayload),
  });

  if (createPosRes.ok) {
    globalForMp.__mpQrPosExternalId = externalPosId;
    return externalPosId;
  }

  const posErr = await createPosRes.json().catch(() => ({}));
  console.warn('Aviso al crear POS MP para QR:', posErr);
  return externalPosId;
}

/**
 * Genera una orden de pago con Código QR Interoperable (EMVCo / Transferencia 3.0)
 * para que el auspiciante pueda escanear desde cualquier billetera (GOcuotas, Naranja X, MODO, Ualá, Personal Pay, Cuenta DNI, Mercado Pago).
 */
export async function createSponsorAllianceQrOrder(params: CreateSponsorAllianceParams) {
  // Generamos primero la preferencia estándar para contar siempre con initPoint de respaldo
  const preference = await createSponsorAlliancePreference(params);

  const plan = getPlanBySector(params.sector);
  const price = params.amount || plan.priceArs;
  const externalReference = preference.externalReference;

  try {
    const collectorId = await getMercadoPagoCollectorId();
    const externalPosId = await ensureMercadoPagoQrPos(collectorId);

    const qrBody = {
      external_reference: externalReference,
      title: `Auspicio Cultural (30 dias) - ${params.brandName}`.slice(0, 60),
      description: `Espacio publicitario ${plan.name} por 30 dias en GUTA MUSICA`.slice(0, 100),
      notification_url: `${SITE_URL}/api/mercadopago/webhook`,
      total_amount: price,
      items: [
        {
          sku_number: `sponsor_${params.allianceId}`,
          category: 'advertising',
          title: `Auspicio 30 dias - ${params.brandName}`.slice(0, 60),
          description: `Plan ${plan.name} en GUTA MUSICA`,
          unit_price: price,
          quantity: 1,
          unit_measure: 'unit',
          total_amount: price,
        },
      ],
    };

    const qrRes = await fetch(
      `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${collectorId}/pos/${externalPosId}/qrs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrBody),
      }
    );

    if (qrRes.ok) {
      const qrJson = await qrRes.json();
      if (qrJson?.qr_data) {
        return {
          qrData: qrJson.qr_data as string,
          isInteroperableEmvco: true,
          initPoint: preference.initPoint,
          preferenceId: preference.preferenceId,
          externalReference,
          amountArs: price,
        };
      }
    } else {
      const errData = await qrRes.json().catch(() => ({}));
      console.warn('⚠️ instore QR devolvió aviso, usando QR de preferencia como fallback:', errData);
    }
  } catch (err: any) {
    console.warn('⚠️ Fallback a initPoint en generación de QR:', err?.message);
  }

  return {
    qrData: preference.initPoint as string,
    isInteroperableEmvco: false,
    initPoint: preference.initPoint,
    preferenceId: preference.preferenceId,
    externalReference,
    amountArs: price,
  };
}

/**
 * Procesa una notificación de tipo merchant_order de Mercado Pago (habitual en pagos con QR)
 */
export async function processMercadoPagoMerchantOrder(orderId: string | number) {
  if (!MP_ACCESS_TOKEN) return { success: false };
  const cleanOrderId = String(orderId).trim();
  if (!cleanOrderId) return { success: false };

  try {
    const res = await fetch(`https://api.mercadopago.com/merchant_orders/${cleanOrderId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!res.ok) return { success: false };

    const order = await res.json();
    const payments = Array.isArray(order.payments) ? order.payments : [];
    for (const p of payments) {
      if (p.status === 'approved' && p.id) {
        await processMercadoPagoPayment(p.id);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Error procesando merchant_order de MP:', err);
    return { success: false };
  }
}

/**
 * Verifica activamente si un auspicio ya fue pagado (en PocketBase o buscando pagos recientes en Mercado Pago)
 */
export async function checkAndActivateSponsorPayment(allianceId: string): Promise<{
  paid: boolean;
  alliance?: any;
}> {
  const pb = await getServerAdminPb();
  let alliance: any = null;

  try {
    alliance = await pb.collection('alliances').getOne(allianceId, { requestKey: null });
    if (alliance?.paymentStatus === 'active' && alliance?.active) {
      return { paid: true, alliance };
    }
  } catch {
    return { paid: false };
  }

  if (MP_ACCESS_TOKEN) {
    try {
      const searchRes = await fetch(
        'https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&status=approved&limit=15',
        {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
        }
      );
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const results = Array.isArray(searchData.results) ? searchData.results : [];
        for (const p of results) {
          const metaAllianceId = p.metadata?.alliance_id;
          const extRef = String(p.external_reference || '');
          const matchesExtRef = extRef.startsWith(`sponsor_alliance|${allianceId}|`);

          if (metaAllianceId === allianceId || matchesExtRef) {
            await processMercadoPagoPayment(p.id);
            const updatedAlliance = await pb
              .collection('alliances')
              .getOne(allianceId, { requestKey: null })
              .catch(() => alliance);
            return { paid: true, alliance: updatedAlliance };
          }
        }
      }
    } catch (err) {
      console.warn('Error consultando pagos recientes de auspicio:', err);
    }
  }

  return { paid: false, alliance };
}

/**
 * Procesa la notificación del Webhook de Mercado Pago cuando un pago es aprobado.
 * Cuenta con doble barrera de idempotencia (lock en memoria + registro en PocketBase)
 * para evitar notificaciones duplicadas cuando Mercado Pago envía IPN + Webhook simultáneos.
 */
export async function processMercadoPagoPayment(paymentId: string | number) {
  if (!MP_ACCESS_TOKEN) return { success: false, error: 'Sin access token' };

  const cleanId = String(paymentId).trim();
  if (!cleanId) return { success: false, error: 'ID de pago vacío' };

  // 1. Si ya fue procesado anteriormente en esta instancia, ignorar duplicado
  if (processedPayments.has(cleanId)) {
    return { success: true, deduplicated: true };
  }

  // 2. Si hay otra petición del webhook procesando el mismo paymentId en este preciso milisegundo,
  // reutilizar la promesa en curso para evitar ejecución doble
  const existingPromise = inFlightPayments.get(cleanId);
  if (existingPromise) {
    return existingPromise;
  }

  const executionPromise = (async () => {
    try {
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${cleanId}`, {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        },
      });

      if (!res.ok) {
        console.error(`❌ No se pudo consultar pago ${cleanId} en Mercado Pago`);
        return { success: false };
      }

      const payment = await res.json();

      if (payment.status !== 'approved') {
        return { success: true, status: payment.status };
      }

      const pb = await getServerAdminPb();

      // 3. Verificar en base de datos si el pago ya fue registrado previamente
      const alreadyInDb = await isPaymentAlreadyProcessedInDb(pb, cleanId);
      if (alreadyInDb) {
        processedPayments.add(cleanId);
        return { success: true, deduplicated: true };
      }

      // Marcar en memoria como procesado para bloquear cualquier reintento inmediato
      processedPayments.add(cleanId);

      const metadata = { ...(payment.metadata || {}) };
      const externalRef = String(payment.external_reference || '');

      // Soporte para pagos por QR Interoperable donde los datos viajan en external_reference
      if (!metadata.type && externalRef.startsWith('sponsor_alliance|')) {
        const [, refAllianceId, refSector, refBrandName] = externalRef.split('|');
        metadata.type = 'sponsor_alliance';
        metadata.alliance_id = refAllianceId;
        metadata.sector = refSector;
        metadata.brand_name = refBrandName;
      }

      const paymentType = metadata.type || 'donation';
      const amount = payment.transaction_amount || metadata.amount || 0;

      // Caso 1: Destaque Semanal ($$): Activar los 7 días automáticamente en PocketBase
      if (paymentType === 'weekly_featured' && metadata.artist_id) {
        const todayIso = new Date().toISOString().split('T')[0];

        try {
          await pb.collection('artists').update(metadata.artist_id, {
            featuredOfWeek: true,
            featuredOfWeekDate: todayIso,
          });

          await sendTelegramMessage({
            text: [
              `🎉 <b>¡NUEVO DESTAQUE SEMANAL PAGADO!</b>`,
              ``,
              `🎸 <b>Artista:</b> <code>${metadata.artist_name || metadata.artist_id}</code>`,
              `💰 <b>Monto cobrado:</b> $${amount} ARS`,
              `📅 <b>Fecha de inicio:</b> ${todayIso}`,
              `⏱️ <b>Vigencia:</b> 7 días corridos (desmarcado automático)`,
              ``,
              `<i>ID Pago MP: <code>${cleanId}</code></i>`,
            ].join('\n'),
            parseMode: 'HTML',
          });
        } catch (err: any) {
          console.error('❌ Error al activar destaque semanal tras pago MP:', err);
        }
      }

      // Caso 2: Auspiciante / Alianza Publicitaria (30 días de vigencia)
      if (paymentType === 'sponsor_alliance' && metadata.alliance_id) {
        const todayIso = new Date().toISOString().split('T')[0];
        const endDateIso = calculateExpirationDate(new Date());

        try {
          await pb.collection('alliances').update(metadata.alliance_id, {
            active: true,
            paymentStatus: 'active',
            startDate: todayIso,
            endDate: endDateIso,
            pricePaid: amount,
            paymentId: cleanId,
          });

          const plan = getPlanBySector(metadata.sector);

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
              `<i>ID Pago MP: <code>${cleanId}</code></i>`,
            ].join('\n'),
            parseMode: 'HTML',
          });
        } catch (err: any) {
          console.error('❌ Error al activar auspicio publicitario tras pago MP:', err);
        }
      }

      // Caso 3: Colaboración Voluntaria: Guardar en historial de PocketBase y notificar 1 sola vez por Telegram
      if (paymentType === 'donation') {
        const extracted = extractDonationFromMpPayment(payment);
        const { created } = await saveContributionToDb(extracted, pb);

        // Solo enviamos el mensaje de Telegram si realmente es un registro nuevo
        if (created) {
          const donorName = extracted.donorName || 'Anónimo';
          const donorMessage = extracted.message;

          await sendTelegramMessage({
            text: [
              `💙 <b>¡NUEVA COLABORACIÓN VOLUNTARIA!</b>`,
              ``,
              `💰 <b>Aporte recibido:</b> <b>$${amount} ARS</b>`,
              `👤 <b>De:</b> ${donorName}`,
              donorMessage ? `📝 <b>Mensaje:</b> <i>"${donorMessage}"</i>` : null,
              ``,
              `¡Gracias por impulsar la música federal en GUTA!`,
              `<i>ID Pago MP: <code>${cleanId}</code></i>`,
            ]
              .filter(Boolean)
              .join('\n'),
            parseMode: 'HTML',
          });
        }
      }

      return { success: true, paymentType, amount };
    } catch (err: any) {
      processedPayments.delete(cleanId);
      console.error('❌ Error al procesar pago de Mercado Pago:', err);
      return { success: false, error: err.message };
    } finally {
      inFlightPayments.delete(cleanId);
    }
  })();

  inFlightPayments.set(cleanId, executionPromise);
  return executionPromise;
}
