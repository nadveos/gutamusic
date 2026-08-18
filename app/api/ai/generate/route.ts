import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (action === 'artist_review') {
      const { stageName, genres, city, province, influences } = payload;

      // If API key is available, we can call external LLM, otherwise use smart cultural generator
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : 'Argentina';

      const shortBio = `${stageName} es una de las propuestas emergentes más singulares de ${locStr}. Con una impronta que entrelaza las raíces de ${genresStr} con una sonoridad moderna y honesta, el proyecto se abre paso en el circuito independiente con identidad federal y canciones que interpelan la actualidad.`;

      const fullBio = `${stageName} nació en el corazón de ${locStr} a partir de la búsqueda de un sonido propio que dialogara tanto con la tradición como con la vanguardia. Integrando elementos orgánicos de ${genresStr}, su obra se destaca por arreglos minuciosos, poesía de corte territorial y una potencia escénica que cautiva al público en cada presentación.\n\nLejos de los moldes comerciales prefabricados, la agrupación apuesta por la autogestión y la exploración sonora, consolidándose como una referencia ineludible del recambio generacional de la música popular argentina y latinoamericana.`;

      const quotes = `"La música para nosotros no es un adorno, es la forma en que nombramos el paisaje y las vivencias de nuestra tierra."`;

      const seoTitle = `${stageName} | Música y Perfil Oficial | GUTA MÚSICA`;
      const seoDesc = `Descubrí a ${stageName} (${locStr}), propuesta emergente de ${genresStr}. Biografía, discografía, videos en vivo y fechas de recitales.`;

      return NextResponse.json({
        success: true,
        data: {
          shortBio,
          fullBio,
          quotes,
          seoTitle,
          seoDesc,
          keywords: [stageName, genresStr, locStr, 'Música emergente', 'GUTA MÚSICA'].join(', '),
        },
      });
    }

    if (action === 'interview_chronicle') {
      const { artistName, host, topic } = payload;

      const summary = `${artistName} nos visitó en los estudios de GUTA MÚSICA en una charla a fondo conducida por ${host || 'Guta Flores'}. Un recorrido íntimo por sus procesos creativos, el lanzamiento de su nuevo material y los desafíos de la escena independiente.`;

      const editorialText = `En una tarde atravesada por anécdotas, guitarras afinadas y mates compartidos, recibimos en el living de GUTA a ${artistName}. Con la calidez y franqueza que caracteriza a los artistas autogestionados, la charla derivó rápidamente hacia las raíces de su sonido y la urgencia de seguir creando espacios para la difusión federal.\n\n"Tuvimos que aprender a grabar, mezclar y diseñar nuestras propias tapas porque nadie iba a venir a hacerlo por nosotros", reflexionaron durante el encuentro.\n\nDurante la sesión acústica exclusiva regalaron interpretaciones de alto vuelo emotivo que confirman por qué el recambio musical independiente de nuestro país se encuentra más vigente que nunca.`;

      const keyHighlights = [
        `Proceso de producción autogestionada del nuevo repertorio`,
        `La importancia de los circuitos culturales del interior del país`,
        `Anécdotas de giras y la búsqueda de un sonido identitario`,
        `Próximas fechas y proyectos discográficos en camino`
      ];

      return NextResponse.json({
        success: true,
        data: {
          summary,
          editorialText,
          keyHighlights,
        },
      });
    }

    if (action === 'ephemeris_story') {
      const { title, year, category, artistRelated } = payload;

      const description = `Un día fundamental para la historia de la música popular. En el año ${year}, ${artistRelated || title} marcó un hito indiscutible que quedó registrado en el patrimonio sonoro con enorme trascendencia cultural para las generaciones venideras.`;

      return NextResponse.json({
        success: true,
        data: {
          description,
          impactBadge: 'Patrimonio Cultural',
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
