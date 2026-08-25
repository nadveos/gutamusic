import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';
const SUPERUSER_EMAIL = 'guflo32@gmail.com';
const SUPERUSER_PASS = '1982Gut@**';

const pb = new PocketBase(POCKETBASE_URL);

// Initial Dataset
const ARTISTS = [
  {
    slug: 'serenata-gaucha',
    stageName: 'Serenata Gaucha',
    realName: 'Ensamble Criollo Contemporáneo',
    genres: ['Folklore', 'Fusión Latinoamericana'],
    city: 'Cosquín',
    province: 'Córdoba',
    country: 'Argentina',
    shortBio: 'Fusión de zambas ancestrales, bombo legüero procesado y guitarras con delay espacial. Ganadores del Pre-Cosquín 2025.',
    bio: 'Serenata Gaucha nace en el corazón de las sierras de Córdoba como un proyecto de relectura del cancionero popular del norte argentino. Integrada por cuatro jóvenes músicos formados en la música clásica y la tradición criolla, la banda experimenta con texturas electrónicas sutiles, afinaciones abiertas de guitarra y polirritmias del bombo legüero, creando un puente sonoro entre el monte profundo y la vanguardia actual.',
    photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1600&auto=format&fit=crop',
    featured: true,
    featuredOfWeek: true,
    quotes: '"No venimos a romper la tradición, venimos a regarla con agua nueva."',
    createdDate: '2026-08-10',
    likesCount: 24,
    socials: {
      spotify: 'https://spotify.com',
      youtube: 'https://youtube.com',
      instagram: 'https://instagram.com',
      tiktok: 'https://tiktok.com',
    },
    videos: [
      {
        id: 'vid-1',
        title: 'Serenata Gaucha - Zamba del Laurel (Sesión en Vivo en las Altas Cumbres)',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
        channelOrAuthor: 'GUTA Sesiones',
        type: 'session',
        duration: '04:32',
        publishedAt: '2026-08-15',
        views: '14.2K',
      }
    ],
    discography: [
      {
        id: 'disc-1',
        title: 'El Viento de la Quebrada',
        type: 'album',
        year: 2025,
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
        spotifyUrl: 'https://spotify.com',
        tracksCount: 9,
        releaseDate: '2025-11-20',
      }
    ],
    agenda: [
      {
        id: 'ev-1',
        title: 'Presentación Oficial de "El Viento de la Quebrada"',
        venue: 'Centro Cultural San Martín',
        city: 'Buenos Aires',
        province: 'CABA',
        country: 'Argentina',
        date: '2026-09-12 21:00',
        ticketUrl: 'https://passline.com',
        ticketPrice: '$12.000 ARS',
        isFree: false,
        type: 'recital',
      }
    ],
    press: [],
    gallery: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop'
    ]
  },
  {
    slug: 'valeria-soler-tango',
    stageName: 'Valeria Soler & La Orquesta Rota',
    genres: ['Tango', 'Música Popular'],
    city: 'San Telmo',
    province: 'Buenos Aires',
    country: 'Argentina',
    shortBio: 'Tango visceral, poesía de conventillo actual y un fuelle furioso que dialoga con guitarras eléctricas saturadas.',
    bio: 'Valeria Soler es cantante, letrista y compositora porteña. Con su ensamble La Orquesta Rota rescata la herencia del tango arrabalero de los años 40 para inyectarle la urgencia del asfalto del siglo XXI.',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1600&auto=format&fit=crop',
    featured: true,
    quotes: '"El tango nunca fue un museo, siempre fue un grito en la esquina."',
    createdDate: '2026-08-05',
    socials: {
      spotify: 'https://spotify.com',
      youtube: 'https://youtube.com',
      instagram: 'https://instagram.com',
    },
    videos: [],
    discography: [],
    agenda: [],
    press: [],
    gallery: []
  },
  {
    slug: 'kallpa-urbano',
    stageName: 'Kallpa 380',
    realName: 'Facundo Huanca',
    genres: ['Hip Hop', 'Música Urbana', 'Fusión Latinoamericana'],
    city: 'San Salvador de Jujuy',
    province: 'Jujuy',
    country: 'Argentina',
    shortBio: 'Trap de altura, rimas en quechua y charango lo-fi desde el norte andino argentino.',
    bio: 'Kallpa 380 combina 808s demoledores con samples analógicos de sikus, quenas y quijadas, retratando la resistencia juvenil en la puna argentina con flow contundente.',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop',
    featured: true,
    createdDate: '2026-08-14',
    socials: {
      spotify: 'https://spotify.com',
      youtube: 'https://youtube.com',
      instagram: 'https://instagram.com',
    },
    videos: [],
    discography: [],
    agenda: [],
    press: [],
    gallery: []
  }
];

const VIDEOS = [
  {
    title: 'Serenata Gaucha - Zamba del Laurel (Sesión en Vivo en las Altas Cumbres)',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    channelOrAuthor: 'GUTA Sesiones',
    type: 'session',
    duration: '04:32',
    publishedAt: '2026-08-15',
    views: '14.2K',
    featured: true,
    artistName: 'Serenata Gaucha',
  },
  {
    title: 'Kallpa 380 - Cerro de Colores (Video Oficial)',
    platform: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop',
    channelOrAuthor: 'Kallpa 380 Vevo',
    type: 'clip',
    duration: '02:48',
    publishedAt: '2026-08-11',
    views: '32.1K',
    featured: true,
    artistName: 'Kallpa 380',
  }
];

const EPHEMERIDES = [
  {
    day: 18,
    month: 8,
    year: 1978,
    title: 'Debut y lanzamiento del primer álbum de Serú Girán',
    description: 'Charly García, David Lebón, Pedro Aznar y Oscar Moro presentan al mundo su primer material discográfico grabado en Búzios y San Pablo, marcando un hito fundacional del rock nacional argentino.',
    category: 'lanzamientos',
    categoryLabel: 'Lanzamiento Histórico',
    source: 'Archivo Histórico del Rock Argentino / SADAIC',
    artistRelated: 'Serú Girán',
    impactBadge: 'Disco Clásico',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 18,
    month: 8,
    year: 1985,
    title: 'Soda Stereo ingresa por primera vez a los rankings internacionales de Billboard Latino',
    description: 'Con el éxito de "Cuando pase el temblor" y "Nada Personal", la banda de Gustavo Cerati comienza la conquista de América Latina posicionando al rock argentino en las listas continentales.',
    category: 'billboard',
    categoryLabel: 'Billboard & Récords',
    source: 'Billboard Latin Archive',
    artistRelated: 'Soda Stereo',
    impactBadge: 'Top 10 Continental',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 18,
    month: 8,
    year: 1992,
    title: 'Registro en SADAIC del Himno "La Memoria" de León Gieco',
    description: 'Queda asentado en el registro oficial de la Sociedad Argentina de Autores y Compositores una de las obras cumbres de la música testimonial y popular latinoamericana.',
    category: 'sadaic',
    categoryLabel: 'Registro SADAIC',
    source: 'Boletín Oficial SADAIC',
    artistRelated: 'León Gieco',
    impactBadge: 'Patrimonio Cultural',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 18,
    month: 8,
    year: 2005,
    title: 'Homenaje Consagratorio a Atahualpa Yupanqui',
    description: 'En una emotiva velada en la Plaza Próspero Molina de Cosquín, más de 20 artistas de folklore y música popular interpretaron la obra cumbre de Don Ata.',
    category: 'cosquin',
    categoryLabel: 'Cosquín & Festivales',
    source: 'Comisión Municipal de Folklore de Cosquín',
    artistRelated: 'Atahualpa Yupanqui',
    impactBadge: 'Homenaje Histórico',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 19,
    month: 8,
    year: 1945,
    title: 'Nacimiento de Sandro (Roberto Sánchez)',
    description: 'Nace en Valentín Alsina el "Gitano", pionero indiscutido del rock en castellano junto a Los de Fuego y máximo ídolo de la balada y la cultura popular latinoamericana.',
    category: 'nacimientos',
    categoryLabel: 'Nacimiento Histórico',
    source: 'Archivo Fonográfico Nacional / SADAIC',
    artistRelated: 'Sandro',
    impactBadge: 'Ícono Popular',
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 19,
    month: 8,
    year: 1951,
    title: 'Nacimiento de Gustavo Santaolalla',
    description: 'Nace en El Palomar el legendario músico, compositor y productor ganador de dos premios Óscar, fundador de Arco Iris y pionero de la fusión del rock con la música andina.',
    category: 'nacimientos',
    categoryLabel: 'Nacimiento',
    source: 'Registro SADAIC / Academia Latina',
    artistRelated: 'Gustavo Santaolalla',
    impactBadge: 'Productor Legendario',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 19,
    month: 8,
    year: 1989,
    title: 'Mercedes Sosa & Milton Nascimento en el Luna Park',
    description: 'La Negra Sosa y el maestro brasileño Milton Nascimento brindan una noche histórica de hermandad latinoamericana ante más de 12.000 personas en Buenos Aires.',
    category: 'cosquin',
    categoryLabel: 'Concierto Histórico',
    source: 'Archivo Diarios Históricos',
    artistRelated: 'Mercedes Sosa',
    impactBadge: 'Cultura Latinoamericana',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop'
  },
  {
    day: 19,
    month: 8,
    year: 2008,
    title: 'Lanzamiento del álbum "Mucho" de Babasónicos',
    description: 'La banda liderada por Adrián Dárgelos publica su noveno disco de estudio, consolidando su reinado en las radios de rock alternativo de todo el continente.',
    category: 'lanzamientos',
    categoryLabel: 'Lanzamiento',
    source: 'Billboard / CAPIF',
    artistRelated: 'Babasónicos',
    impactBadge: 'Disco de Oro',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop'
  }
];

const INTERVIEWS = [
  {
    slug: 'serenata-gaucha-en-vivo-guta-estudio',
    title: 'Serenata Gaucha: "El folklore no es nostalgia, es territorio y presente"',
    subtitle: 'El cuarteto cordobés nos visitó en los estudios GUTA y presentó su nuevo álbum',
    artistId: 'art-1',
    artistName: 'Serenata Gaucha',
    artistSlug: 'serenata-gaucha',
    artistPhoto: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    host: 'Guta Flores',
    date: '18 de Agosto de 2026',
    summary: 'Serenata Gaucha nos visitó el 18 de agosto de 2026 y presentó su nuevo material discográfico. Una charla a fondo sobre el proceso de grabación en las sierras.',
    editorialText: 'En una tarde cargada de mística y guitarras afinadas en Do menor, recibimos en el living de GUTA a los integrantes de Serenata Gaucha...',
    keyHighlights: [
      'Cómo grabaron su disco de forma autogestionada en las Altas Cumbres',
      'La utilización del delay analógico en la guitarra criolla',
      'El rol de las nuevas plataformas digitales en la difusión federal'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoPlatform: 'youtube',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    category: 'Acústico GUTA'
  }
];

const EVENTS = [
  {
    title: 'Presentación Oficial de "El Viento de la Quebrada"',
    venue: 'Centro Cultural San Martín - Sala AB',
    city: 'Buenos Aires',
    province: 'CABA',
    country: 'Argentina',
    date: '2026-09-12 21:00',
    ticketUrl: 'https://passline.com',
    ticketPrice: '$12.000 ARS',
    isFree: false,
    type: 'recital',
  },
  {
    title: 'Gran Peña de la Primavera e Independencia',
    venue: 'Plaza Próspero Molina',
    city: 'Cosquín',
    province: 'Córdoba',
    country: 'Argentina',
    date: '2026-10-04 20:00',
    isFree: true,
    type: 'pena',
  }
];

async function seed() {
  console.log(`📡 Conectando a PocketBase en ${POCKETBASE_URL}...`);

  try {
    try {
      await pb.collection('_superusers').authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (_superusers)');
    } catch (e) {
      await pb.admins.authWithPassword(SUPERUSER_EMAIL, SUPERUSER_PASS);
      console.log('✅ Autenticado como Superusuario (admins legacy)');
    }

    // Seed Artists
    console.log('\n🎤 Insertando Artistas...');
    for (const artist of ARTISTS) {
      try {
        await pb.collection('artists').create(artist);
        console.log(`   + Artista: ${artist.stageName}`);
      } catch (err) {
        console.log(`   ! Artista ${artist.stageName} (puede que ya exista o error: ${err.message})`);
      }
    }

    // Seed Videos
    console.log('\n🎬 Insertando Videos...');
    for (const video of VIDEOS) {
      try {
        await pb.collection('videos').create(video);
        console.log(`   + Video: ${video.title}`);
      } catch (err) {
        console.log(`   ! Video (error: ${err.message})`);
      }
    }

    // Seed Ephemerides
    console.log('\n📅 Insertando Efemérides...');
    for (const eph of EPHEMERIDES) {
      try {
        await pb.collection('ephemerides').create(eph);
        console.log(`   + Efeméride: ${eph.title}`);
      } catch (err) {
        console.log(`   ! Efeméride (error: ${err.message})`);
      }
    }

    // Seed Interviews
    console.log('\n📻 Insertando Entrevistas...');
    for (const interview of INTERVIEWS) {
      try {
        await pb.collection('interviews').create(interview);
        console.log(`   + Entrevista: ${interview.title}`);
      } catch (err) {
        console.log(`   ! Entrevista (error: ${err.message})`);
      }
    }

    // Seed Events
    console.log('\n🎫 Insertando Eventos en Agenda...');
    for (const ev of EVENTS) {
      try {
        await pb.collection('events').create(ev);
        console.log(`   + Evento: ${ev.title}`);
      } catch (err) {
        console.log(`   ! Evento (error: ${err.message})`);
      }
    }

    console.log('\n🎉 ¡Poblado de PocketBase completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error.message);
  }
}

seed();
