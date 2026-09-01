import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';
const SUPERUSER_EMAIL = process.env.PB_EMAIL || 'guflo32@gmail.com';
const SUPERUSER_PASS = process.env.PB_PASSWORD || '1982Gut@**';

const pb = new PocketBase(POCKETBASE_URL);

async function setupSiteSettingsCollection() {
  console.log(`🔌 Conectando a PocketBase en: ${POCKETBASE_URL}...`);

  try {
    try {
      await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (_superusers)');
    } catch (e) {
      await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (admins legacy)');
    }

    // Check if 'site_settings' collection exists
    let collectionExists = false;
    try {
      const existing = await pb.collections.getOne('site_settings');
      if (existing) {
        collectionExists = true;
        console.log('ℹ️ La colección "site_settings" ya existe en PocketBase.');
      }
    } catch (err) {
      collectionExists = false;
    }

    if (!collectionExists) {
      console.log('📦 Creando colección "site_settings" en PocketBase...');
      const collectionData = {
        name: 'site_settings',
        type: 'base',
        listRule: '', // Public read access
        viewRule: '', // Public read access
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'key',
            type: 'text',
            required: true,
          },
          {
            name: 'data',
            type: 'json',
            required: false,
          },
        ],
      };

      try {
        await pb.collections.create(collectionData);
        console.log('✅ Colección "site_settings" creada con éxito.');
      } catch (createErr) {
        console.warn('⚠️ Intento schema 0.23+ falló, intentando schema clásico:', createErr.message);
        const fallbackSchema = {
          name: 'site_settings',
          type: 'base',
          listRule: '',
          viewRule: '',
          schema: [
            { name: 'key', type: 'text', required: true },
            { name: 'data', type: 'json' },
          ],
        };
        await pb.collections.create(fallbackSchema);
        console.log('✅ Colección "site_settings" creada con esquema legacy.');
      }
    }

    // Check if default official_socials record exists
    try {
      const existingRecord = await pb.collection('site_settings').getFirstListItem('key="official_socials"');
      console.log('ℹ️ Registro "official_socials" existente con ID:', existingRecord.id);
    } catch {
      console.log('🚀 Creando registro inicial con @sesionesrg...');
      const defaultData = {
        brandName: '@sesionesrg',
        badgeText: 'Sesiones RG Oficial',
        tiktok: { handle: 'sesionesrg', active: true },
        instagram: { handle: 'sesionesrg', active: true },
        facebook: { handle: 'sesionesrg', active: true },
        kick: { handle: 'sesionesrg', active: true },
        twitch: { handle: 'sesionesrg', active: true },
      };

      await pb.collection('site_settings').create({
        key: 'official_socials',
        data: JSON.stringify(defaultData),
      });
      console.log('✅ Registro inicial de @sesionesrg insertado.');
    }

    console.log('\n🎉 ¡Configuración de colección "site_settings" completada!');
  } catch (err) {
    console.error('❌ Error configurando site_settings:', err.message);
  }
}

setupSiteSettingsCollection();
