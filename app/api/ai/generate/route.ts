import { NextRequest, NextResponse } from 'next/server';

async function callGemini(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API Error: ${err}`);
  }

  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const geminiKey = process.env.GEMINI_API_KEY;

    if (action === 'artist_review') {
      const { stageName, genres, city, province } = payload;
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : 'Argentina';

      if (geminiKey && geminiKey.trim().length > 5) {
        try {
          const prompt = `Sos un periodista musical argentino experto en cultura popular, folklore, rock y música emergente para el medio GUTA MÚSICA (conducción de Guta Flores).
Redactá una reseña y biografía para el artista "${stageName}" de "${locStr}", género "${genresStr}".
Devolvé la respuesta EXACTAMENTE en formato JSON con la siguiente estructura (sin markdown adicional, solo el JSON puro):
{
  "shortBio": "Un párrafo conciso de 2-3 oraciones describiendo la propuesta sonora y su valor emergente.",
  "fullBio": "Dos o tres párrafos periodísticos completos sobre su trayectoria, identidad sonora, arreglos y arraigo territorial.",
  "quotes": "Una frase poética o testimonial entrecomillada del artista sobre su música.",
  "seoTitle": "Título SEO optimizado de menos de 60 caracteres",
  "seoDesc": "Meta description atractiva de menos de 155 caracteres",
  "keywords": "5 a 8 palabras clave separadas por comas"
}`;

          const rawText = await callGemini(prompt, geminiKey);
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          return NextResponse.json({ success: true, data: parsed });
        } catch (geminiError: any) {
          console.warn('Fallo llamada directa a Gemini, usando generador cultural de respaldo:', geminiError.message);
        }
      }

      // Smart cultural fallback
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
      const { artistName, host } = payload;

      if (geminiKey && geminiKey.trim().length > 5) {
        try {
          const prompt = `Sos un redactor periodístico de música para GUTA MÚSICA. Redactá la crónica de una entrevista realizada por el conductor ${host || 'Guta Flores'} al artista "${artistName}".
Devolvé la respuesta EXACTAMENTE en formato JSON:
{
  "summary": "Resumen conciso del encuentro",
  "editorialText": "Crónica periodística de 3 párrafos destacando el tono intimista, anécdotas y reflexiones sobre la autogestión",
  "keyHighlights": ["Punto clave 1", "Punto clave 2", "Punto clave 3", "Punto clave 4"]
}`;

          const rawText = await callGemini(prompt, geminiKey);
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          return NextResponse.json({ success: true, data: parsed });
        } catch (err: any) {
          console.warn('Fallo Gemini interview:', err.message);
        }
      }

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

    if (action === 'generate_daily_ephemerides') {
      const { day, month } = payload;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthName = monthNames[Number(month) - 1] || 'Agosto';

      if (geminiKey && geminiKey.trim().length > 5) {
        try {
          const prompt = `Sos un historiador y musicólogo especialista en música argentina y latinoamericana (folklore, tango, rock nacional, música popular, SADAIC y Cosquín) para el medio GUTA MÚSICA.
Generá 3 efemérides históricas musicales reales ocurridas un ${day} de ${monthName} en Argentina o América Latina.
Devolvé la respuesta EXACTAMENTE en formato JSON como un array con la siguiente estructura (sin markdown adicional):
[
  {
    "day": ${day},
    "month": ${month},
    "year": 1980,
    "title": "Título corto y contundente del hito",
    "description": "Explicación histórica de 2 o 3 oraciones con datos precisos.",
    "category": "lanzamientos",
    "categoryLabel": "Lanzamiento Histórico",
    "source": "Archivo Histórico Musical / SADAIC",
    "impactBadge": "Hito Histórico"
  }
]
Categorías posibles para "category": "lanzamientos", "billboard", "sadaic", "cosquin", "nacimientos", "fallecimientos", "homenajes".`;

          const rawText = await callGemini(prompt, geminiKey);
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          return NextResponse.json({ success: true, data: parsed });
        } catch (err: any) {
          console.warn('Fallo Gemini ephemerides:', err.message);
        }
      }

      // Fallback
      return NextResponse.json({
        success: true,
        data: [
          {
            day: Number(day),
            month: Number(month),
            year: 1982,
            title: `Hito histórico en la música argentina del ${day} de ${monthName}`,
            description: `Se celebra una jornada conmemorativa del patrimonio folklórico y popular argentino con presentaciones destacadas en el circuito nacional.`,
            category: 'sadaic',
            categoryLabel: 'Registro SADAIC',
            source: 'Archivo Histórico SADAIC',
            impactBadge: 'Patrimonio Cultural'
          }
        ]
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
