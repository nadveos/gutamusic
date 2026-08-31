import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';
const SUPERUSER_EMAIL = process.env.PB_EMAIL || 'guflo32@gmail.com';
const SUPERUSER_PASS = process.env.PB_PASSWORD || '1982Gut@**';

const pb = new PocketBase(POCKETBASE_URL);

async function setupAlliancesCollection() {
  console.log(`🔌 Conectando a PocketBase en: ${POCKETBASE_URL}...`);

  try {
    try {
      await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (_superusers)');
    } catch (e) {
      await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (admins legacy)');
    }

    // Check if 'alliances' collection already exists
    let collectionExists = false;
    try {
      const existing = await pb.collections.getOne('alliances');
      if (existing) {
        collectionExists = true;
        console.log('ℹ️ La colección "alliances" ya existe en PocketBase.');
      }
    } catch (err) {
      collectionExists = false;
    }

    if (!collectionExists) {
      console.log('📦 Creando colección "alliances" en PocketBase...');
      
      const collectionData = {
        name: 'alliances',
        type: 'base',
        listRule: '', // Public read access
        viewRule: '', // Public read access
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
          },
          {
            name: 'category',
            type: 'text',
            required: false,
          },
          {
            name: 'description',
            type: 'text',
            required: false,
          },
          {
            name: 'imageUrl',
            type: 'text',
            required: false,
          },
          {
            name: 'image',
            type: 'file',
            required: false,
            maxSelect: 1,
            maxSize: 5242880,
          },
          {
            name: 'phone',
            type: 'text',
            required: false,
          },
          {
            name: 'whatsapp',
            type: 'text',
            required: false,
          },
          {
            name: 'websiteUrl',
            type: 'text',
            required: false,
          },
          {
            name: 'email',
            type: 'email',
            required: false,
          },
          {
            name: 'sector',
            type: 'select',
            required: false,
            values: ['global_footer', 'home_mid', 'artistas_catalog', 'agenda_events', 'all_sections'],
          },
          {
            name: 'active',
            type: 'bool',
            required: false,
          },
          {
            name: 'priority',
            type: 'number',
            required: false,
          }
        ]
      };

      try {
        await pb.collections.create(collectionData);
        console.log('✅ Colección "alliances" creada con éxito con reglas de lectura pública.');
      } catch (createErr) {
        console.warn('⚠️ Intento de creación con schema 0.23+ falló, intentando schema clásico:', createErr.message);
        
        // Fallback for schema definitions in PB < 0.23
        const fallbackSchema = {
          name: 'alliances',
          type: 'base',
          listRule: '',
          viewRule: '',
          schema: [
            { name: 'name', type: 'text', required: true },
            { name: 'category', type: 'text' },
            { name: 'description', type: 'text' },
            { name: 'imageUrl', type: 'text' },
            { name: 'phone', type: 'text' },
            { name: 'whatsapp', type: 'text' },
            { name: 'websiteUrl', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'sector', type: 'text' },
            { name: 'active', type: 'bool' },
            { name: 'priority', type: 'number' }
          ]
        };
        await pb.collections.create(fallbackSchema);
        console.log('✅ Colección "alliances" creada con esquema legacy.');
      }
    }

    // Insert sample items if empty
    console.log('\n🔍 Verificando registros existentes en "alliances"...');
    const records = await pb.collection('alliances').getFullList({ requestKey: null });
    console.log(`📊 Cantidad de auspiciantes encontrados: ${records.length}`);

    if (records.length === 0) {
      console.log('🚀 Insertando auspiciantes iniciales de prueba...');
      const SAMPLE_ALLIANCES = [
        {
          name: 'Guitarras & Cuerdas Criollas',
          category: 'Luthier & Instrumentos',
          description: 'Fabricación artesanal de instrumentos de concierto para música popular latinoamericana.',
          imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop',
          phone: '+54 9 351 456-7890',
          whatsapp: '5493514567890',
          websiteUrl: 'https://instagram.com',
          sector: 'global_footer',
          active: true,
          priority: 1,
        },
        {
          name: 'Estudio La Calera Sound',
          category: 'Grabación & Mastering',
          description: 'Estudio boutique especializado en mezcla de música raíz folklórica, rock e indie federal.',
          imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop',
          phone: '+54 9 11 3344-5566',
          whatsapp: '5491133445566',
          websiteUrl: 'https://instagram.com',
          sector: 'global_footer',
          active: true,
          priority: 2,
        },
        {
          name: 'Sonido Federal & Escenarios',
          category: 'Audio en Vivo & Técnica',
          description: 'Sistemas line array, iluminación inteligente y microfonía profesional para festivales.',
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
          phone: '+54 9 341 678-9012',
          whatsapp: '5493416789012',
          websiteUrl: 'https://instagram.com',
          sector: 'global_footer',
          active: true,
          priority: 3,
        }
      ];

      for (const item of SAMPLE_ALLIANCES) {
        try {
          await pb.collection('alliances').create(item);
          console.log(`   + Creado auspiciante: ${item.name}`);
        } catch (itemErr) {
          console.warn(`   ! Error al insertar ${item.name}:`, itemErr.message);
        }
      }
    }

    console.log('\n🎉 ¡Proceso de inicialización de la colección "alliances" completado con éxito!');
  } catch (err) {
    console.error('❌ Error general durante la configuración:', err.message);
  }
}

setupAlliancesCollection();
