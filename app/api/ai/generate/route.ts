import { NextRequest, NextResponse } from 'next/server';
import { getRealEphemerides } from '@/lib/services/ephemeridesScraper';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function extractJson(text: string): any {
  if (!text) return null;

  // Direct parse attempt
  try {
    return JSON.parse(text);
  } catch (e) {
    const clean = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
      return JSON.parse(clean);
    } catch (err) {}

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =========================================================================
// callGeminiEphemerides: ONLY for date-critical ephemerides.
// Uses thinking models + Google Search grounding. NEVER falls back to lite.
// =========================================================================
const EPHEMERIDES_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

async function callGeminiEphemerides(prompt: string, apiKey: string) {
  let lastError: Error | null = null;

  for (const model of EPHEMERIDES_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log('\n======================================================');
      console.log(`🔍 [EPHEMERIDES] Model: ${model} (intento ${attempt + 1}/${maxRetries})`);
      console.log(`🔑 Key Prefix: ${apiKey.substring(0, 8)}... (Length: ${apiKey.length})`);
      if (attempt === 0) {
        console.log('📝 PROMPT:');
        console.log(prompt);
      }
      console.log('======================================================\n');

      try {
        const startTime = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(35000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
        });

        const durationMs = Date.now() - startTime;
        const rawText = await response.text();

        console.log(`📥 [EPHEMERIDES] ${model} - Status: ${response.status} (${durationMs}ms)`);

        if (response.status === 429) {
          const waitSec = 5 * (attempt + 1);
          if (attempt < maxRetries - 1) {
            console.warn(`⚠️ ${model} 429 (quota). Esperando ${waitSec}s...`);
            await sleep(waitSec * 1000);
            continue;
          }
          console.warn(`⚠️ ${model} 429 tras ${maxRetries} intentos.`);
          lastError = new Error(`429 on ${model}`);
          break;
        }

        if (!response.ok) {
          console.warn(`⚠️ ${model} error ${response.status}: ${rawText.substring(0, 200)}`);
          lastError = new Error(`${response.status} on ${model}`);
          break;
        }

        let resultJson: any = {};
        try { resultJson = JSON.parse(rawText); } catch (e) {}

        const usage = resultJson?.usageMetadata;
        const groundingMeta = resultJson?.candidates?.[0]?.groundingMetadata;
        const webSources = groundingMeta?.groundingChunks?.length || 0;

        if (groundingMeta) {
          console.log(`🌐 [GROUNDING] ${webSources} fuentes web encontradas.`);
        }

        const parts = resultJson?.candidates?.[0]?.content?.parts || [];
        const generatedContent = parts.map((p: any) => p.text || '').join('');

        console.log('📄 CONTENIDO:');
        console.log(generatedContent.substring(0, 1000));
        console.log('======================================================\n');

        const parsedData = extractJson(generatedContent);
        if (!parsedData) {
          console.warn(`⚠️ JSON no parseable de ${model}. Raw (300 chars): ${generatedContent.substring(0, 300) || '(vacío)'}`);
          break;
        }

        return {
          data: parsedData,
          usage: usage || { totalTokenCount: 'N/A' },
          usedModel: model,
          groundedSources: webSources,
        };
      } catch (err: any) {
        console.warn(`⚠️ Error ${model} (intento ${attempt + 1}): ${err.message}`);
        lastError = err;
        break;
      }
    }
  }

  // FALLBACK: Try WITHOUT search grounding (still only thinking models)
  console.log('\n🔄 Grounding falló en todos. Intentando SIN grounding con modelos thinking...');
  for (const model of EPHEMERIDES_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      console.log(`🤖 [FALLBACK] Intentando ${model} sin grounding...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        console.warn(`⚠️ ${model} fallback falló (${response.status})`);
        continue;
      }

      const rawText = await response.text();
      let resultJson: any = {};
      try { resultJson = JSON.parse(rawText); } catch (e) {}

      const parts = resultJson?.candidates?.[0]?.content?.parts || [];
      const generatedContent = parts.map((p: any) => p.text || '').join('');
      const parsedData = extractJson(generatedContent);

      if (parsedData) {
        console.log(`✅ [FALLBACK] ${model} respondió sin grounding.`);
        console.log('📄 CONTENIDO:');
        console.log(generatedContent.substring(0, 1000));
        return {
          data: parsedData,
          usage: resultJson?.usageMetadata || { totalTokenCount: 'N/A' },
          usedModel: `${model} (sin grounding)`,
          groundedSources: 0,
        };
      }
    } catch (err: any) {
      console.warn(`⚠️ Fallback ${model}: ${err.message}`);
    }
  }

  return null; // Signal that NO reliable model was available
}

// =========================================================================
// callGeminiWithLog: For NON-date-critical tasks (artist reviews, etc).
// Uses all models including lite.
// =========================================================================
async function callGeminiWithLog(prompt: string, apiKey: string) {
  const allModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
  let lastError: Error | null = null;

  for (const model of allModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 3072,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) continue;

      const rawText = await response.text();
      let resultJson: any = {};
      try { resultJson = JSON.parse(rawText); } catch (e) {}

      const generatedContent = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsedData = extractJson(generatedContent);
      if (!parsedData) continue;

      return {
        data: parsedData,
        usage: resultJson?.usageMetadata || { totalTokenCount: 'N/A' },
        usedModel: model,
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Todos los modelos de Gemini fallaron.');
}

// =========================================================================
// POST HANDLER
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'generate_daily_ephemerides') {
      const { day, month, region = 'latam_general', sources } = payload;
      const requestedDay = Number(day);
      const requestedMonth = Number(month);

      try {
        console.log(`\n🔍 [EPHEMERIDES] Buscando efemérides en fuentes reales para el ${requestedDay}/${requestedMonth}...`);
        const items = await getRealEphemerides(requestedDay, requestedMonth, region, sources);

        return NextResponse.json({
          success: true,
          source: 'real-archives',
          model: 'Archivos Históricos Reales (MusicBrainz, CRock, Efe Eme, Folklore & Mía FM)',
          tokenUsage: { totalTokenCount: 0 },
          region,
          groundedSources: items.length,
          dropped: 0,
          data: items,
        });
      } catch (err: any) {
        console.error('❌ Error obteniendo efemérides de fuentes reales:', err.message);
        return NextResponse.json({
          success: false,
          error: `Error al consultar archivos: ${err.message}`,
        }, { status: 500 });
      }
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (!geminiKey || geminiKey.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró la GEMINI_API_KEY en .env.local. Agregá tu clave y reiniciá el servidor.',
      }, { status: 400 });
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
          model: result.usedModel,
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
          model: result.usedModel,
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
