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
// callGeminiWithLog: For NON-date-critical tasks (artist reviews, editorial refinement, etc).
// =========================================================================
async function callGeminiWithLog(prompt: string, apiKey: string) {
  const allModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];
  let lastError: Error | null = null;

  for (const model of allModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) continue;

      const rawText = await response.text();
      let resultJson: any = {};
      try { resultJson = JSON.parse(rawText); } catch (e) {}

      const parts = resultJson?.candidates?.[0]?.content?.parts || [];
      const generatedContent = parts.map((p: any) => p.text || '').join('');
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

/**
 * Intenta extraer el contenido de texto de una URL pública o Google Doc compartido
 */
async function fetchExternalSourceText(rawUrl: string): Promise<{
  text: string;
  requiresManualPaste?: boolean;
  notice?: string;
}> {
  const url = (rawUrl || '').trim();
  if (!url) return { text: '' };

  // 1. Si es un enlace de NotebookLM (notebooklm.google.com), Google exige sesión OAuth personal del navegador
  if (url.includes('notebooklm.google.com')) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
      });
      const finalUrl = res.url || '';
      const html = await res.text();
      if (
        finalUrl.includes('accounts.google.com') ||
        html.includes('accounts.google.com/ServiceLogin') ||
        html.length < 500
      ) {
        return {
          text: '',
          requiresManualPaste: true,
          notice:
            'Los cuadernos de NotebookLM están protegidos por tu sesión privada de Google. Copiá el texto o editorial desde NotebookLM y pegalo en el campo de Cuerpo Editorial con el botón "Pegar de NotebookLM".',
        };
      }
    } catch {
      return {
        text: '',
        requiresManualPaste: true,
        notice:
          'NotebookLM requiere sesión privada de Google. Pegá directamente el texto de tu cuaderno en el editor.',
      };
    }
  }

  // 2. Si es un Google Doc compartido ("Cualquier persona con el enlace"), usar export?format=txt
  const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (gdocMatch && gdocMatch[1]) {
    try {
      const exportUrl = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;
      const res = await fetch(exportUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const txt = await res.text();
        if (txt && txt.trim().length > 20) {
          return { text: txt.trim().slice(0, 18000) };
        }
      }
    } catch {}
  }

  // 3. Cualquier otra URL pública (nota de prensa, blog, web)
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GutaMusicaEditorialBot/1.0; +https://guta.musica.ar)',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const html = await res.text();
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleaned.length > 50) {
        return { text: cleaned.slice(0, 15000) };
      }
    }
  } catch {}

  return {
    text: '',
    requiresManualPaste: true,
    notice: 'No se pudo leer la URL de forma pública. Pegá el texto directamente en el editor.',
  };
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

    if (action === 'fetch_source_url') {
      const { sourceUrl } = payload || {};
      const extracted = await fetchExternalSourceText(sourceUrl || '');
      return NextResponse.json({
        success: true,
        text: extracted.text,
        requiresManualPaste: extracted.requiresManualPaste || false,
        notice: extracted.notice || null,
      });
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    if (!geminiKey || geminiKey.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró la GEMINI_API_KEY en .env.local. Agregá tu clave y reiniciá el servidor.',
      }, { status: 400 });
    }

    if (
      action === 'article_generation' ||
      action === 'journalistic_note' ||
      action === 'refine_editorial'
    ) {
      const {
        stageName,
        genres,
        city,
        province,
        topic,
        host = 'Guta Flores',
        category = 'Acústico GUTA',
        sourceUrl = '',
        notebookSourceText = '',
        draftTitle = '',
        draftSubtitle = '',
        draftSummary = '',
        draftEditorialText = '',
        draftQuotes = '',
      } = payload;
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : (province || 'Argentina');

      let externalSourceContent = (notebookSourceText || '').trim();
      if (!externalSourceContent && sourceUrl) {
        const fetched = await fetchExternalSourceText(sourceUrl);
        if (fetched.text) {
          externalSourceContent = fetched.text;
        }
      }

      const combinedDraftOrSource = [
        externalSourceContent ? `--- FUENTE / CUADERNO NOTEBOOKLM ---\n${externalSourceContent}` : '',
        draftTitle ? `Título borrador: ${draftTitle}` : '',
        draftSubtitle ? `Subtítulo borrador: ${draftSubtitle}` : '',
        draftSummary ? `Resumen borrador: ${draftSummary}` : '',
        draftQuotes ? `Cita borrador: ${draftQuotes}` : '',
        draftEditorialText ? `--- TEXTO EDITORIAL / BORRADOR ---\n${draftEditorialText}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const sourceInstructions = combinedDraftOrSource
        ? `\nIMPORTANTE — MATERIAL BASE DE NOTEBOOKLM / BORRADOR EDITORIAL PROVISTO POR EL EDITOR:
Basate ESTRICTAMENTE en el siguiente texto/apuntes reales para redactar, estructurar y refinar la nota. Respetá fielmente los nombres de canciones, discos, integrantes, fechas, citas e historias reales del texto base (NO inventes datos ficticios que contradigan la fuente). Pulí la prosa con estilo periodístico profesional de revista musical argentina, organizá el cuerpo con subtítulos Markdown (##) y completá todos los campos editoriales:\n\n${combinedDraftOrSource}\n`
        : '';

      const prompt = `Sos un periodista musical y crítico cultural de primer nivel para el medio GUTA MÚSICA (conducción editorial: ${host}).
${
  action === 'refine_editorial'
    ? `Refiná, estructurá y potenciá periodísticamente la siguiente EDITORIAL / NOTA sobre el artista "${stageName}" (${locStr}), género "${genresStr}".`
    : `Redactá una NOTA PERIODÍSTICA / ARTÍCULO EDITORIAL COMPLETO para publicar en la revista/sitio de GUTA sobre el artista "${stageName}" (${locStr}), género "${genresStr}".`
}
Enfoque temático: "${topic || 'Perfil sonoro, trayectoria independiente y propuesta musical'}".
${sourceInstructions}
Devolvé la respuesta exclusivamente en formato JSON válido con la siguiente estructura:
{
  "title": "Titular periodístico contundente, atractivo y profesional (si el borrador ya tiene un buen título, pulilo conservando su esencia)",
  "subtitle": "Bajada o copete periodístico de 2 oraciones que sintetiza el núcleo de la nota",
  "summary": "Resumen conciso de 1 párrafo para las tarjetas de portada del sitio",
  "editorialText": "Cuerpo completo del artículo en formato Markdown con subtítulos estructurados (##), análisis musical detallado, citas y contexto territorial (al menos 4 párrafos enriquecedores basados en el material provisto)",
  "keyHighlights": [
    "Dato o reflexión clave 1",
    "Dato o reflexión clave 2",
    "Dato o reflexión clave 3",
    "Dato o reflexión clave 4"
  ],
  "quotes": "Frase destacada o declaración del artista entre comillas",
  "seoTitle": "Título SEO de menos de 60 caracteres",
  "seoDesc": "Meta description periodística de menos de 155 caracteres",
  "category": "${category}"
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
        console.error('❌ Error en article_generation Gemini:', err.message);
        return NextResponse.json({
          success: false,
          error: err.message,
        }, { status: 500 });
      }
    }

    if (action === 'artist_review') {
      const {
        stageName,
        genres,
        city,
        province,
        notebookSourceText = '',
        draftEditorialText = '',
      } = payload;
      const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Independiente';
      const locStr = city ? `${city}, ${province || 'Argentina'}` : 'Argentina';
      const baseSource = [notebookSourceText, draftEditorialText].filter(Boolean).join('\n\n');

      const prompt = `Sos un periodista musical argentino para el medio GUTA MÚSICA (conducción: Guta Flores).
Redactá una biografía y reseña periodística para el artista emergente "${stageName}" (${locStr}), género "${genresStr}".
${
  baseSource
    ? `\nBasate estrictamente en los siguientes apuntes o editorial de NotebookLM del artista (respetando sus datos reales, canciones e historia):\n${baseSource}\n`
    : ''
}
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
      const {
        artistName,
        host = 'Guta Flores',
        topic = 'Sesión acústica y charla sobre autogestión',
        notebookSourceText = '',
        draftEditorialText = '',
      } = payload;
      const baseSource = [notebookSourceText, draftEditorialText].filter(Boolean).join('\n\n');

      const prompt = `Sos un redactor periodístico de música para GUTA MÚSICA. Redactá la crónica de una entrevista realizada por el conductor ${host} al artista "${artistName}".
Enfoque: "${topic}".
${
  baseSource
    ? `\nBasate estrictamente en los siguientes apuntes o editorial de NotebookLM sobre el encuentro:\n${baseSource}\n`
    : ''
}
Devolvé la respuesta en formato JSON:
{
  "title": "Titular de la entrevista o crónica",
  "subtitle": "Bajada periodística del encuentro",
  "summary": "Resumen conciso del encuentro",
  "editorialText": "Crónica periodística de 3 a 4 párrafos en Markdown destacando el tono intimista, anécdotas y reflexiones sobre la autogestión musical",
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
