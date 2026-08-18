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

async function callGeminiWithLog(prompt: string, apiKey: string) {
  // Flagship ultra-fast model with JSON mode
  const model = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  console.log('\n======================================================');
  console.log('🤖 [GEMINI REQUEST]');
  console.log(`📡 Model: ${model}`);
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
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
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
    console.error('Error parseando respuesta completa de Gemini:', e);
  }

  const usage = resultJson?.usageMetadata;
  if (usage) {
    console.log('📊 CONTEO DE TOKENS (Gemini usageMetadata):');
    console.log(`   - Prompt Tokens:     ${usage.promptTokenCount}`);
    console.log(`   - Candidates Tokens: ${usage.candidatesTokenCount}`);
    console.log(`   - Total Tokens:      ${usage.totalTokenCount}`);
  }

  const generatedContent = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('📄 CONTENIDO GENERADO:');
  console.log(generatedContent);
  console.log('======================================================\n');

  const parsedData = extractJson(generatedContent);
  if (!parsedData) {
    throw new Error(`No se pudo parsear el JSON devuelto por Gemini. Texto: ${generatedContent.substring(0, 200)}`);
  }

  return {
    data: parsedData,
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
      return NextResponse.json({
        success: false,
        error: 'No se encontró la GEMINI_API_KEY en .env.local. Agregá tu clave y reiniciá el servidor.',
      }, { status: 400 });
    }

    if (action === 'generate_daily_ephemerides') {
      const { day, month, category } = payload;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      const monthName = monthNames[Number(month) - 1] || 'Agosto';

      const prompt = `Sos un historiador y musicólogo experto en música argentina y latinoamericana (folklore, tango, rock nacional, música popular, SADAIC, Cosquín, Jesús María, Billboard).
Investigá y devolvé exactamente 3 efemérides históricas y culturales reales ocurridas un ${day} de ${monthName} (a lo largo de toda la historia: 1940 a 2025).
${category && category !== 'todas' ? `Priorizá la categoría o temática: "${category}".` : ''}

El formato de respuesta debe ser un array JSON de objetos con la siguiente estructura:
[
  {
    "day": ${day},
    "month": ${month},
    "year": 1985,
    "title": "Título preciso del hito musical",
    "description": "Descripción histórica precisa de 2 a 3 oraciones con nombres propios.",
    "category": "lanzamientos",
    "categoryLabel": "Lanzamientos Históricos",
    "source": "Nombre del archivo / SADAIC / Festival",
    "impactBadge": "Hito Histórico"
  }
]`;

      try {
        const { data, usage } = await callGeminiWithLog(prompt, geminiKey);
        return NextResponse.json({
          success: true,
          source: 'gemini-live',
          tokenUsage: usage,
          data: Array.isArray(data) ? data : [data],
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
        const { data, usage } = await callGeminiWithLog(prompt, geminiKey);
        return NextResponse.json({
          success: true,
          source: 'gemini-live',
          tokenUsage: usage,
          data,
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
        const { data, usage } = await callGeminiWithLog(prompt, geminiKey);
        return NextResponse.json({
          success: true,
          source: 'gemini-live',
          tokenUsage: usage,
          data,
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
