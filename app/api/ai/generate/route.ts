import { NextRequest, NextResponse } from 'next/server';

async function callGeminiWithLog(prompt: string, apiKey: string) {
  // Use current Google Gemini flagship fast model
  const model = 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log('\n======================================================');
  console.log('🤖 [GEMINI REQUEST]');
  console.log(`📡 URL Model: ${model}`);
  console.log(`🔑 Key Prefix: ${apiKey.substring(0, 8)}... (Length: ${apiKey.length})`);
  console.log('📝 PROMPT ENVIADO:');
  console.log(prompt);
  console.log('======================================================\n');

  const startTime = Date.now();
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

  const durationMs = Date.now() - startTime;
  const rawTextResponse = await response.text();

  console.log('\n======================================================');
  console.log(`📥 [GEMINI RESPONSE] - Status: ${response.status} ${response.statusText} (${durationMs}ms)`);

  if (!response.ok) {
    console.error('❌ ERROR DETALLADO DE GEMINI API:');
    console.error(rawTextResponse);
    console.log('======================================================\n');
    throw new Error(`Gemini API Error (${response.status}): ${rawTextResponse}`);
  }

  let resultJson: any = {};
  try {
    resultJson = JSON.parse(rawTextResponse);
  } catch (e) {
    console.error('Error parseando JSON de Gemini:', e);
  }

  // Log Token Count
  const usage = resultJson?.usageMetadata;
  if (usage) {
    console.log('📊 CONTEO DE TOKENS (Gemini usageMetadata):');
    console.log(`   - Prompt Tokens:     ${usage.promptTokenCount}`);
    console.log(`   - Candidates Tokens: ${usage.candidatesTokenCount}`);
    console.log(`   - Total Tokens:      ${usage.totalTokenCount}`);
  } else {
    console.log('📊 Token usage metadata no provisto por el endpoint.');
  }

  const generatedContent = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('📄 CONTENIDO GENERADO:');
  console.log(generatedContent);
  console.log('======================================================\n');

  return {
    text: generatedContent,
    usage: usage || { totalTokenCount: 'N/A' },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    console.log(`\n🚀 [API /api/ai/generate] Acción: "${action}" | GEMINI_API_KEY presente: ${Boolean(geminiKey && geminiKey.length > 5)}`);

    if (!geminiKey || geminiKey.length < 5) {
      console.warn('⚠️ ATENCIÓN: GEMINI_API_KEY no está configurada o está vacía en .env.local.');
    }

    if (action === 'generate_daily_ephemerides') {
      const { day, month, category } = payload;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthName = monthNames[Number(month) - 1] || 'Agosto';

      if (geminiKey && geminiKey.length > 5) {
        try {
          const prompt = `Sos un historiador y musicólogo experto en música argentina y latinoamericana (folklore, tango, rock nacional, música popular, SADAIC, Cosquín, Jesús María y premios).
Investigá y generá 3 efemérides históricas y culturales reales ocurridas un ${day} de ${monthName} (a lo largo de toda la historia: 1950 a 2025).
${category && category !== 'todas' ? `Priorizá si es posible la categoría o temática: "${category}".` : ''}

Devolvé la respuesta ÚNICAMENTE en formato JSON plano (un array de objetos), sin texto introductorio ni formato markdown:
[
  {
    "day": ${day},
    "month": ${month},
    "year": 1985,
    "title": "Título preciso y contundente del hito",
    "description": "Descripción histórica periodística de 2 a 3 oraciones con nombres propios y contexto.",
    "category": "lanzamientos",
    "categoryLabel": "Lanzamientos Históricos",
    "source": "Nombre del archivo / SADAIC / Festival",
    "impactBadge": "Hito Histórico"
  }
]`;

          const { text, usage } = await callGeminiWithLog(prompt, geminiKey);
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          return NextResponse.json({
            success: true,
            source: 'gemini-live',
            tokenUsage: usage,
            data: parsed,
          });
        } catch (geminiError: any) {
          console.error('❌ Falló la consulta a Gemini en efemérides:', geminiError.message);
          return NextResponse.json({
            success: false,
            source: 'error',
            error: `Error de Gemini API: ${geminiError.message}`,
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({
          success: false,
          source: 'no-api-key',
          error: 'No se encontró la GEMINI_API_KEY en .env.local. Por favor agregá tu clave en .env.local y reiniciá el servidor.',
        }, { status: 400 });
      }
    }

    if (action === 'artist_review') {
      const { stageName, genres, city, province } = payload;
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : 'Argentina';

      if (geminiKey && geminiKey.length > 5) {
        try {
          const prompt = `Sos un periodista musical argentino para el medio GUTA MÚSICA (conducción: Guta Flores).
Redactá una biografía y reseña periodística para el artista emergente "${stageName}" (${locStr}), género "${genresStr}".
Devolvé la respuesta ÚNICAMENTE como JSON con la estructura:
{
  "shortBio": "Párrafo conciso de 2 oraciones para tarjetas de portada.",
  "fullBio": "Tres párrafos sobre su identidad sonora, arreglos, raíces territoriales y propuesta en vivo.",
  "quotes": "Frase poética o testimonial entre comillas.",
  "seoTitle": "Título SEO de menos de 60 caracteres",
  "seoDesc": "Meta description de menos de 155 caracteres",
  "keywords": "Palabras clave separadas por comas"
}`;

          const { text, usage } = await callGeminiWithLog(prompt, geminiKey);
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          return NextResponse.json({
            success: true,
            source: 'gemini-live',
            tokenUsage: usage,
            data: parsed,
          });
        } catch (err: any) {
          console.error('❌ Error en artist_review con Gemini:', err.message);
          return NextResponse.json({
            success: false,
            error: err.message,
          }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Acción no configurada o falta API Key' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error general en /api/ai/generate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
