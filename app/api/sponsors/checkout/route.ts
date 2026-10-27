import { NextRequest, NextResponse } from 'next/server';
import { getServerAdminPb, POCKETBASE_URL } from '@/lib/pocketbase';
import PocketBase from 'pocketbase';
import { createSponsorAlliancePreference } from '@/lib/services/mercadopagoService';
import { getPlanBySector } from '@/lib/constants/sponsorPricing';
import { AllianceSector } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      sector,
      category = 'General',
      description = '',
      imageUrl = '',
      phone = '',
      whatsapp = '',
      instagramUrl = '',
      websiteUrl = '',
      email,
      password,
    } = body;

    if (!brandName || !sector || !email) {
      return NextResponse.json(
        { success: false, error: 'Nombre de la marca, espacio y email son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminPb = await getServerAdminPb();

    let sponsorUserId: string | null = null;
    let clientAuthToken: string | null = null;

    // 1. Manejo de cuenta de usuario (Auspiciante)
    try {
      // Buscar si el usuario ya existe
      const existingUser = await adminPb.collection('users').getFirstListItem(`email = "${cleanEmail}"`);
      sponsorUserId = existingUser.id;

      // Si nos dio password, intentar autenticar para devolver token de sesión
      if (password) {
        try {
          const clientPb = new PocketBase(POCKETBASE_URL);
          const authData = await clientPb.collection('users').authWithPassword(cleanEmail, password);
          clientAuthToken = authData.token;
        } catch {
          // Si falló la autenticación con contraseña pero existe, permitimos continuar la compra
        }
      }
    } catch (findErr: any) {
      // No existe, creamos el usuario auspiciante automáticamente
      if (password && password.length >= 8) {
        try {
          const newUser = await adminPb.collection('users').create({
            email: cleanEmail,
            password: password,
            passwordConfirm: password,
            name: brandName,
            role: 'sponsor',
            verified: true,
          });
          sponsorUserId = newUser.id;

          // Autenticar para devolver sesión directa
          const clientPb = new PocketBase(POCKETBASE_URL);
          const authData = await clientPb.collection('users').authWithPassword(cleanEmail, password);
          clientAuthToken = authData.token;
        } catch (createErr: any) {
          console.warn('⚠️ Error al crear usuario auspiciante en PB:', createErr?.message);
        }
      }
    }

    // 2. Crear el registro en la colección 'alliances' (en estado pendiente)
    const plan = getPlanBySector(sector as AllianceSector);

    const allianceRecord = await adminPb.collection('alliances').create({
      name: brandName.trim(),
      category: category.trim() || 'Servicios & Cultura',
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      instagramUrl: instagramUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      email: cleanEmail,
      sector: sector,
      active: false, // Se activa al pagar mediante el Webhook de Mercado Pago
      paymentStatus: 'pending',
      sponsorUserId: sponsorUserId || '',
      pricePaid: plan.priceArs,
    });

    // 3. Generar la preferencia de pago en Mercado Pago Checkout Pro
    const mpPreference = await createSponsorAlliancePreference({
      allianceId: allianceRecord.id,
      brandName: brandName.trim(),
      sector: sector as AllianceSector,
      userEmail: cleanEmail,
      amount: plan.priceArs,
    });

    return NextResponse.json({
      success: true,
      initPoint: mpPreference.initPoint,
      preferenceId: mpPreference.preferenceId,
      allianceId: allianceRecord.id,
      token: clientAuthToken,
      user: sponsorUserId ? { id: sponsorUserId, email: cleanEmail } : null,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/sponsors/checkout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar el auspicio.' },
      { status: 500 }
    );
  }
}
