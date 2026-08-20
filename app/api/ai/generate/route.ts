import { NextRequest, NextResponse } from 'next/server';

function extractJson(text: string) {
  if (!text) return null;
  // Strip markdown code fences if present
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    // Attempt to extract from first [ to last ]
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (err) {}
    }

    // Attempt to extract from first { to last }
    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (err) {}
    }
  }

  return null;
}

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

// General-purpose Gemini call with automatic fallback cascade
async function callGeminiWithLog(prompt: string, apiKey: string) {
  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log('\n======================================================');
    console.log(`🤖 [GEMINI REQUEST] Trying Model: ${model}`);
    console.log(`🔑 Key Prefix: ${apiKey.substring(0, 8)}... (Length: ${apiKey.length})`);
    console.log('======================================================\n');

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      });

      const durationMs = Date.now() - startTime;
      const rawTextResponse = await response.text();

      console.log(`📥 [GEMINI RESPONSE] Model: ${model} - Status: ${response.status} (${durationMs}ms)`);

      if (!response.ok) {
        console.warn(`⚠️ Error en ${model} (${response.status}): ${rawTextResponse.substring(0, 150)}`);
        lastError = new Error(`Gemini API Error (${response.status} on ${model}): ${rawTextResponse}`);
        // If 503, 429, or 404, continue to next fallback model
        continue;
      }

      let resultJson: any = {};
      try {
        resultJson = JSON.parse(rawTextResponse);
      } catch (e) {
        console.error('Error parseando respuesta completa de Gemini:', e);
      }

      const usage = resultJson?.usageMetadata;
      const generatedContent = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsedData = extractJson(generatedContent);

      if (!parsedData) {
        throw new Error(`No se pudo parsear el JSON devuelto por ${model}.`);
      }

      return {
        data: parsedData,
        usage: usage || { totalTokenCount: 'N/A' },
        usedModel: model,
      };
    } catch (err: any) {
      console.warn(`⚠️ Falló intento con ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('Todos los modelos de Gemini fallaron o están temporalmente inaccesibles.');
}

// Ephemerides-specific call: attempts Google Search Grounding with fallback cascade
async function callGeminiEphemerides(prompt: string, apiKey: string) {
  let lastError: Error | null = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log('\n======================================================');
    console.log(`🔍 [GEMINI EPHEMERIDES] Intentando Model: ${model} (con Google Search Grounding)`);
    console.log('======================================================\n');

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
      });

      const durationMs = Date.now() - startTime;
      const rawTextResponse = await response.text();

      console.log(`📥 [EPHEMERIDES RESPONSE] Model: ${model} - Status: ${response.status} (${durationMs}ms)`);

      if (!response.ok) {
        console.warn(`⚠️ ${model} falló con status ${response.status}. Probando siguiente modelo...`);
        lastError = new Error(`Gemini API Error (${response.status} on ${model}): ${rawTextResponse}`);
        continue;
      }

      let resultJson: any = {};
      try {
        resultJson = JSON.parse(rawTextResponse);
      } catch (e) {
        console.error('Error parseando respuesta:', e);
      }

      const usage = resultJson?.usageMetadata;
      const groundingMetadata = resultJson?.candidates?.[0]?.groundingMetadata;
      const webSources = groundingMetadata?.groundingChunks?.length || 0;

      const parts = resultJson?.candidates?.[0]?.content?.parts || [];
      const generatedContent = parts.map((p: any) => p.text || '').join('');
      const parsedData = extractJson(generatedContent);

      if (!parsedData) {
        console.warn(`⚠️ ${model} respondió pero el formato JSON no fue válido. Probando siguiente...`);
        continue;
      }

      return {
        data: parsedData,
        usage: usage || { totalTokenCount: 'N/A' },
        groundedSources: webSources,
        usedModel: model,
      };
    } catch (err: any) {
      console.warn(`⚠️ Error ejecutando ${model}:`, err.message);
      lastError = err;
    }
  }

  // Fallback: si con grounding fallaron todos, intentamos sin grounding con callGeminiWithLog
  console.log('🔄 Todos los intentos con Grounding fallaron. Reintentando sin Grounding...');
  return callGeminiWithLog(prompt, apiKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    console.log(`\n🚀 [API /api/ai/generate] Acción: "${action}" | GEMINI_API_KEY presente: ${Boolean(geminiKey && geminiKey.length > 5)}`);

    if (!geminiKey || geminiKey.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró la GEMINI_API_KEY en .env.local. Agregá tu clave y reiniciá el servidor.',
      }, { status: 400 });
    }

    if (action === 'generate_daily_ephemerides') {
      const { day, month, category, region = 'argentina' } = payload;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthName = monthNames[Number(month) - 1] || 'Agosto';

      // Build region-specific context for the prompt
      const regionContextMap: Record<string, { name: string; institutions: string; references: string; artists: string }> = {
        argentina: {
          name: 'Argentina',
          institutions: 'SADAIC, CAPIF, Premios Gardel, Festival de Cosquín, Festival de Jesús María',
          references: 'Rock Nacional, tango, folklore, cumbia, cuarteto',
          artists: 'Mercedes Sosa, Soda Stereo, Charly García, Atahualpa Yupanqui, Los Redondos, Piazzolla'
        },
        mexico: {
          name: 'México',
          institutions: 'SACM (Sociedad de Autores y Compositores de México), Premios Billboard México, Grammy Latino',
          references: 'mariachi, norteño, banda, bolero, cumbia sonidera, rock en español, música popular mexicana',
          artists: 'Juan Gabriel, Vicente Fernández, Los Ángeles Azules, Café Tacvba, Molotov, Selena, José Alfredo Jiménez, Chavela Vargas'
        },
        colombia: {
          name: 'Colombia',
          institutions: 'SAYCO (Sociedad de Autores y Compositores de Colombia), Festival Vallenato de Valledupar, Festival de Música del Pacífico Petronio Álvarez',
          references: 'vallenato, cumbia, mapalé, porro, champeta, salsa caleña, música andina colombiana',
          artists: 'Carlos Vives, Shakira, Joe Arroyo, Totó la Momposina, Juanes, J Balvin, Diomedes Díaz, Gustavo Cerati (gira Colombia)'
        },
        chile: {
          name: 'Chile',
          institutions: 'SCD (Sociedad Chilena del Derecho de Autor), Festival de Viña del Mar, Festival de la Canción de Viña',
          references: 'nueva canción chilena, rock chileno, cumbia chilena, cueca, música andina, balada romántica',
          artists: 'Violeta Parra, Víctor Jara, Los Jaivas, Chancho en Piedra, Los Prisioneros, Mon Laferte, Colo'
        },
        peru: {
          name: 'Perú',
          institutions: 'APDAYC (Asociación Peruana de Autores y Compositores), Festival de Ancash, Premios Luces',
          references: 'cumbia andina, chicha, música criolla, marinera norteña, huayno, valses criollos',
          artists: 'Chabuca Granda, Arturo "Zambo" Cavero, Los Shapis, Gian Marco, Pedro Suárez-Vértiz, Eva Ayllón'
        },
        venezuela: {
          name: 'Venezuela',
          institutions: 'SACVEN (Sociedad de Autores y Compositores de Venezuela), Festival Nuevas Bandas',
          references: 'llanera, joropo, salsa, merengue venezolano, gaita zuliana, rock venezolano',
          artists: 'Simón Díaz, Ricardo Montaner, Franco De Vita, Ilan Chester, Porfi Jiménez, Desorden Público'
        },
        bolivia: {
          name: 'Bolivia',
          institutions: 'SOBODAYCOM, Festival Internacional de Folklore de Oruro, Entrada Universitaria',
          references: 'música andina boliviana, tinku, morenada, saya afroboliviana, huayno, cumbia villera boliviana',
          artists: 'Gladys Moreno, Los Kjarkas, Savia Andina, Bolivia Manta, Kalamarka'
        },
        ecuador: {
          name: 'Ecuador',
          institutions: 'SAYCE (Sociedad de Autores y Compositores del Ecuador), Festival de Música de Cuenca',
          references: 'pasillo ecuatoriano, bomba del chota, música nacional ecuatoriana, sanjuanito, albazo',
          artists: 'Julio Jaramillo, Paulina Tamayo, Daniel Betancourth, Amorfoda (Bad Bunny con artistas ecuatorianos)'
        },
        uruguay: {
          name: 'Uruguay',
          institutions: 'AGADU (Asociación General de Autores del Uruguay), Montevideo Music Box, Carnaval de Montevideo',
          references: 'candombe, tango uruguayo, murga, milonga, rock uruguayo, cumbia villera',
          artists: 'Jorge Drexler, Jaime Roos, Alfredo Zitarrosa, Los Shakers, El Cuarteto de Nos, No Te Va Gustar'
        },
        paraguay: {
          name: 'Paraguay',
          institutions: 'AUTORES (Asociación Autores del Paraguay), Festival de Música Paraguaya',
          references: 'guarania, polca paraguaya, música tradicional paraguaya, cumbia paraguaya',
          artists: 'Agustín Barrios Mangoré, José Asunción Flores, Los Paraguayos, Berta Rojas'
        },
        brasil: {
          name: 'Brasil',
          institutions: 'ECAD (Escritório Central de Arrecadação e Distribuição), Grammy Latino, Latin Billboard',
          references: 'samba, bossa nova, baião, forró, axé, pagode, MPB (Música Popular Brasileira), tropicália',
          artists: 'Tom Jobim, João Gilberto, Elis Regina, Caetano Veloso, Gilberto Gil, Roberto Carlos, Chico Buarque, Maria Bethânia'
        },
        cuba: {
          name: 'Cuba',
          institutions: 'UNEAC (Unión de Escritores y Artistas de Cuba), Centro Nacional de Derechos de Autor (CENDA)',
          references: 'son cubano, bolero, mambo, danzón, cha-cha-chá, rumba, nueva trova cubana',
          artists: 'Compay Segundo, Celia Cruz, Benny Moré, Pablo Milanés, Silvio Rodríguez, Ibrahim Ferrer'
        },
        puerto_rico: {
          name: 'Puerto Rico',
          institutions: 'ASCAP Puerto Rico, Grammy Latino',
          references: 'salsa puertorriqueña, reggaetón, plena, bomba, música jíbara',
          artists: 'Marc Anthony, Ricky Martin, Bad Bunny, Daddy Yankee, Willie Colón, Héctor Lavoe, Cheo Feliciano'
        },
        republica_dominicana: {
          name: 'República Dominicana',
          institutions: 'SGACEDOM, Premio Soberano',
          references: 'merengue, bachata, palo, salve',
          artists: 'Juan Luis Guerra, Johnny Ventura, Celia Cruz (con RD), Romeo Santos, Aventura'
        },
        centroamerica: {
          name: 'Centroamérica (Guatemala, Nicaragua, Costa Rica, El Salvador, Honduras, Panamá)',
          institutions: 'Institutos nacionales de cultura, festivales centroamericanos',
          references: 'música marimba, chicha centroamericana, vallenato centroamericano, rock regional, cumbia local',
          artists: 'Rubén Blades (Panamá), Maná (México con raíces CA), Ricardo Arjona (Guatemala)'
        },
        latam_general: {
          name: 'toda América Latina y Brasil (incluyendo Argentina, México, Colombia, Brasil, Chile, Perú, Uruguay, Venezuela, Cuba, Puerto Rico y Centroamérica)',
          institutions: 'SADAIC, SACM, SAYCO, SCD, APDAYC, ECAD, AGADU, Grammy Latino, Billboard Latin, Premios Gardel, Viña del Mar, Cosquín',
          references: 'Rock Nacional y en español, tango, folklore, MPB, samba, bossa nova, salsa, cumbia, vallenato, mariachi, bolero, nueva canción, reggaetón',
          artists: 'Charly García, Mercedes Sosa, Soda Stereo, Caetano Veloso, Tom Jobim, Shakira, Juan Gabriel, Los Jaivas, Chabuca Granda, Violeta Parra, Celia Cruz, Rubén Blades, Luis Miguel'
        }
      };

      const ctx = regionContextMap[region] || regionContextMap['argentina'];

      const prompt = `Eres un historiador musical experto en ritmos, géneros y artistas de Latinoamérica y Brasil. Tu único objetivo es buscar y detallar efemérides musicales (nacimientos, fallecimientos, lanzamientos de álbumes históricos, conciertos icónicos o hitos culturales) que ocurrieron el ${day} de ${monthName} en cualquier año de la historia (1900–2025).

Cobertura: ${ctx.name}. Géneros de referencia: ${ctx.references}. Instituciones: ${ctx.institutions}. Artistas emblema: ${ctx.artists}.
${category && category !== 'todas' ? `Tipo de hecho preferido: ${category}.` : ''}

Reglas de veracidad (usa la búsqueda de Google para validar antes de responder):
1. Solo incluir hechos ocurridos EXACTAMENTE el día ${day} de ${monthName}. Si el hecho ocurrió en otro día del mes, NO lo incluyas.
2. Para lanzamientos: la fecha debe ser la fecha real de edición física o digital verificable, no la de grabación ni la de anuncio.
3. Si no encontrás suficientes hechos verificados para esa fecha exacta, devolvé menos elementos o un array vacío []. La precisión vale más que la cantidad.
4. Nunca inventes ni aproximes fechas para completar 3 resultados.

Devolvé ÚNICAMENTE un array JSON válido (sin texto fuera del JSON). Cada objeto debe tener exactamente estos campos:
[
  {
    "day": ${day},
    "month": ${month},
    "year": 1985,
    "title": "Título breve y preciso del hecho",
    "description": "Dos oraciones informativas: qué ocurrió, quiénes estuvieron involucrados, y su impacto cultural en ${ctx.name} y Latinoamérica.",
    "category": "nacimientos",
    "categoryLabel": "Nacimiento",
    "source": "Fuente consultada (registro civil, discográfica, archivo de prensa, etc.)",
    "impactBadge": "Hito Histórico"
  }
]`;

      try {
        const result = await callGeminiEphemerides(prompt, geminiKey);
        const rawItems = Array.isArray(result.data) ? result.data : (result.data ? [result.data] : []);

        // Server-side guard: drop any item where day/month doesn't match the query.
        const validatedItems = rawItems.filter((item: any) => {
          const itemDay = Number(item.day);
          const itemMonth = Number(item.month);
          if (itemDay !== Number(day) || itemMonth !== Number(month)) {
            console.warn(`⚠️ [ANTI-HALLUC] Dropped: day=${itemDay} month=${itemMonth} (expected ${day}/${month}): "${item.title}"`);
            return false;
          }
          return true;
        });

        return NextResponse.json({
          success: true,
          source: 'gemini-live-grounded',
          model: (result as any).usedModel || 'gemini-3.6-flash',
          tokenUsage: result.usage,
          region: ctx.name,
          groundedSources: (result as any).groundedSources ?? 0,
          dropped: rawItems.length - validatedItems.length,
          data: validatedItems,
        });

      } catch (err: any) {
        console.error('❌ Error en efemérides Gemini:', err.message);
        return NextResponse.json({
          success: false,
          error: err.message,
        }, { status: 500 });
      }
    }

    if (action === 'artist_review') {
      const { stageName, genres, city, province } = payload;
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : 'Argentina';

      const prompt = `Sos un periodista musical argentino para el medio GUTA MÚSICA (conducción: Guta Flores).
Redactá una biografía y reseña periodística para el artista emergente "${stageName}" (${locStr}), género "${genresStr}".
Devolvé la respuesta en formato JSON con la siguiente estructura:
{
  "shortBio": "Párrafo conciso de 2 oraciones para tarjetas de portada.",
  "fullBio": "Tres párrafos sobre su identidad sonora, arreglos, raíces territoriales y propuesta en vivo.",
  "quotes": "Frase poética o testimonial entre comillas.",
  "seoTitle": "Título SEO de menos de 60 caracteres",
  "seoDesc": "Meta description de menos de 155 caracteres",
  "keywords": "Palabras clave separadas por comas"
}`;

      try {
        const result = await callGeminiWithLog(prompt, geminiKey);
        return NextResponse.json({
          success: true,
          source: 'gemini-live',
          model: (result as any).usedModel || 'gemini-3.6-flash',
          tokenUsage: result.usage,
          data: result.data,
        });
      } catch (err: any) {
        console.error('❌ Error en artist_review Gemini:', err.message);
        return NextResponse.json({
          success: false,
          error: err.message,
        }, { status: 500 });
      }
    }

    if (action === 'interview_chronicle') {
      const { artistName, host } = payload;

      const prompt = `Sos un redactor periodístico de música para GUTA MÚSICA. Redactá la crónica de una entrevista realizada por el conductor ${host || 'Guta Flores'} al artista "${artistName}".
Devolvé la respuesta en formato JSON:
{
  "summary": "Resumen conciso del encuentro",
  "editorialText": "Crónica periodística de 3 párrafos destacando el tono intimista, anécdotas y reflexiones sobre la autogestión",
  "keyHighlights": ["Punto clave 1", "Punto clave 2", "Punto clave 3", "Punto clave 4"]
}`;

      try {
        const result = await callGeminiWithLog(prompt, geminiKey);
        return NextResponse.json({
          success: true,
          source: 'gemini-live',
          model: (result as any).usedModel || 'gemini-3.6-flash',
          tokenUsage: result.usage,
          data: result.data,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          error: err.message,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error general en /api/ai/generate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
