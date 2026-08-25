import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';
const SUPERUSER_EMAIL = process.env.PB_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || 'guflo32@gmail.com';
const SUPERUSER_PASS = process.env.PB_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || '1982Gut@**';

const pb = new PocketBase(POCKETBASE_URL);

async function setup() {
  console.log(`📡 Conectando a PocketBase en ${POCKETBASE_URL}...`);

  try {
    try {
      await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (_superusers)');
    } catch {
      await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (admins legacy)');
    }

    // 1. Check or create 'artist_likes' collection
    console.log('🔍 Verificando colección "artist_likes"...');
    let collectionExists = false;
    try {
      await pb.collections.getOne('artist_likes');
      collectionExists = true;
      console.log('✅ La colección "artist_likes" ya existe.');
    } catch {
      collectionExists = false;
    }

    if (!collectionExists) {
      console.log('⚡ Creando colección "artist_likes"...');
      try {
        // PocketBase 0.23+ format with fields
        await pb.collections.create({
          name: 'artist_likes',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: '',
          fields: [
            {
              name: 'artist',
              type: 'text',
              required: true,
            },
            {
              name: 'ipHash',
              type: 'text',
              required: true,
            },
          ],
        });
        console.log('🎉 Colección "artist_likes" creada con éxito (formato fields).');
      } catch (err1) {
        // Fallback to legacy schema format
        try {
          await pb.collections.create({
            name: 'artist_likes',
            type: 'base',
            listRule: '',
            viewRule: '',
            createRule: '',
            updateRule: '',
            deleteRule: '',
            schema: [
              {
                name: 'artist',
                type: 'text',
                required: true,
              },
              {
                name: 'ipHash',
                type: 'text',
                required: true,
              },
            ],
          });
          console.log('🎉 Colección "artist_likes" creada con éxito (formato schema).');
        } catch (err2) {
          console.error('❌ Error al crear colección:', err1?.message || err2?.message);
        }
      }
    }

    // 2. Check and ensure likesCount on 'artists' collection
    console.log('🔍 Verificando campo "likesCount" en colección "artists"...');
    try {
      const artistsCol = await pb.collections.getOne('artists');
      console.log('✅ Colección "artists" verificada.');
    } catch (e) {
      console.warn('⚠️ No se pudo verificar la colección artists:', e.message);
    }

    console.log('🏁 Proceso finalizado.');
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

setup();
