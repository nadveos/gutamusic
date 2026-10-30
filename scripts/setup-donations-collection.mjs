import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';
const SUPERUSER_EMAIL = process.env.PB_EMAIL || 'guflo32@gmail.com';
const SUPERUSER_PASS = process.env.PB_PASSWORD || '1982Gut@**';

const pb = new PocketBase(POCKETBASE_URL);

async function setupDonationsCollection() {
  console.log(`🔌 Conectando a PocketBase en: ${POCKETBASE_URL}...`);

  try {
    try {
      await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (_superusers)');
    } catch {
      await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (admins legacy)');
    }

    let collectionExists = false;
    try {
      const existing = await pb.collections.getOne('donations');
      if (existing) {
        collectionExists = true;
        console.log('ℹ️ La colección "donations" ya existe en PocketBase.');
      }
    } catch {
      collectionExists = false;
    }

    if (!collectionExists) {
      console.log('📦 Creando colección "donations" en PocketBase...');
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
        console.log('✅ Colección "donations" creada con éxito.');
      } catch (err) {
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
        console.log('✅ Colección "donations" creada con esquema legacy.');
      }
    }

    // Verificar si ya está registrado el primer aporte voluntario 185782556551
    try {
      const existing = await pb.collection('donations').getFirstListItem('paymentId="185782556551"');
      console.log('ℹ️ El pago 185782556551 ya se encuentra registrado:', existing.id);
    } catch {
      await pb.collection('donations').create({
        paymentId: '185782556551',
        amount: 5000,
        netAmount: 5000,
        donorName: 'Anónimo',
        donorEmail: '',
        message: '¡Primer aporte voluntario recibido en la plataforma!',
        status: 'approved',
        paymentMethod: 'Mercado Pago',
        paymentType: 'donation',
        date: '2026-10-30T09:45:00-03:00',
      });
      console.log('✅ Primer aporte voluntario (ID: 185782556551 - $5.000 ARS) registrado.');
    }

    console.log('\n🎉 ¡Configuración de la colección "donations" completada!');
  } catch (err) {
    console.error('❌ Error configurando donations:', err.message);
  }
}

setupDonationsCollection();
