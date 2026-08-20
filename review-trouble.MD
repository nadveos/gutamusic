# Mejora del sistema de efemérides musicales — GUTA MÚSICA

## Objetivo

Mejorar el sistema actual de generación de efemérides musicales para evitar resultados con fechas incorrectas o inventadas.

El problema actual es que el modelo puede devolver músicos, discos o acontecimientos relacionados con la música, pero cuya fecha real **no coincide con el día y mes consultados**.

Ejemplo del problema actual:

* Se consulta una fecha determinada.
* El modelo devuelve un nacimiento o fallecimiento musical.
* La persona/artista puede ser relevante.
* Pero la fecha real del acontecimiento no coincide con la fecha solicitada.

El sistema debe priorizar **exactitud histórica sobre cantidad de resultados**.

---

# 1. Problema actual

Actualmente el sistema realiza una única llamada al modelo:

```text
Prompt
  ↓
Gemini
  ↓
JSON final
```

Esto hace que el modelo tenga que realizar simultáneamente:

1. descubrir acontecimientos;
2. recordar información histórica;
3. buscar información;
4. verificar fechas;
5. decidir relevancia;
6. clasificar;
7. generar el JSON.

Esto aumenta considerablemente la posibilidad de alucinaciones y fechas incorrectas.

Además, la implementación actual no utiliza explícitamente Google Search grounding.

---

# 2. Nueva arquitectura

Implementar un flujo de dos etapas:

```text
                    FECHA CONSULTADA
                           │
                           ▼
                ┌─────────────────────┐
                │ 1. DISCOVERY        │
                │ Gemini + Search     │
                └──────────┬──────────┘
                           │
                           ▼
                    CANDIDATOS
                           │
                           ▼
                ┌─────────────────────┐
                │ 2. VERIFICATION     │
                │ Gemini + Search     │
                └──────────┬──────────┘
                           │
                    ┌──────┴──────┐
                    │             │
                 válido        inválido
                    │             │
                    ▼             X
             resultado final
                    │
                    ▼
                JSON final
                    │
                    ▼
            Validación JavaScript
```

La idea fundamental es:

> **Discovery encuentra candidatos. Verification decide cuáles realmente ocurrieron en la fecha solicitada.**

No deben mezclarse ambas responsabilidades.

---

# 3. Etapa 1 — Discovery

La primera llamada debe buscar candidatos potenciales.

No debe intentar producir todavía las efemérides definitivas.

## Prompt de Discovery

```js
const discoveryPrompt = `
Investigá efemérides musicales para GUTA MÚSICA.

FECHA OBJETIVO:
${day} de ${monthName}

Buscá posibles acontecimientos musicales ocurridos EXACTAMENTE ese día y mes, independientemente del año.

ÁMBITO:
${ctx.name}, América Latina, Brasil e Iberoamérica.

Para Brasil considerá también fuentes en portugués.

CATEGORÍAS:

- nacimientos;
- fallecimientos;
- lanzamientos originales de álbumes o canciones;
- estrenos;
- primeras grabaciones;
- registros de obras;
- conciertos históricos;
- recitales;
- festivales;
- acontecimientos importantes de bandas;
- premios;
- acontecimientos relevantes de la industria musical;
- otros hitos musicales históricos.

${
  selectedCategoryLabel
    ? `CATEGORÍA EXCLUSIVA:
${selectedCategoryLabel}

No busques acontecimientos pertenecientes a otras categorías.`
    : `No existe una categoría específica. Investigá todas las categorías relevantes.`
}

IMPORTANTE:

La fecha buscada es la FECHA REAL DEL ACONTECIMIENTO.

No utilices como fecha del acontecimiento:

- fecha de publicación de una noticia;
- fecha de actualización de una página;
- fecha de publicación de una efeméride;
- fecha de aniversario;
- fecha de reedición;
- fecha de remasterización;
- fecha de anuncio;
- fecha de retransmisión.

No inventes fechas.

No infieras fechas.

No utilices acontecimientos de días cercanos.

No modifiques fechas para hacerlas coincidir con ${day} de ${monthName}.

Buscá candidatos potenciales, pero no inventes información que no puedas encontrar.

NO existe límite máximo de candidatos.

Devolvé únicamente JSON válido:

[
  {
    "name": "",
    "category": "",
    "claimedDay": 0,
    "claimedMonth": 0,
    "claimedYear": 0,
    "description": ""
  }
]
`;
```

---

# 4. Habilitar Google Search

La llamada a Gemini debe utilizar búsqueda web/Google Search grounding.

La estructura debe ser equivalente a:

```js
const response = await fetch(url, {
  method: 'POST',

  headers: {
    'Content-Type': 'application/json',
  },

  signal: AbortSignal.timeout(30000),

  body: JSON.stringify({
    contents: [
      {
        parts: [
          {
            text: discoveryPrompt,
          },
        ],
      },
    ],

    tools: [
      {
        google_search: {},
      },
    ],

    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  }),
});
```

IMPORTANTE:

La sintaxis exacta de `tools.google_search` debe adaptarse a la versión de Gemini API/modelo utilizada actualmente por el proyecto.

No modificar la URL, modelo ni autenticación existente sin comprobar primero qué API está utilizando el proyecto.

---

# 5. Guardar Grounding Metadata

Actualmente se extrae solamente:

```js
const generatedContent =
  resultJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
```

Agregar:

```js
const candidate = resultJson?.candidates?.[0];

const generatedContent =
  candidate?.content?.parts?.[0]?.text || '';

const groundingMetadata =
  candidate?.groundingMetadata;
```

Durante desarrollo registrar:

```js
console.log(
  '🔎 GROUNDING:',
  JSON.stringify(groundingMetadata, null, 2)
);
```

El objetivo es poder comprobar:

* qué búsquedas realizó Gemini;
* qué fuentes encontró;
* qué páginas utilizó;
* si realmente está utilizando Search grounding.

No confiar únicamente en el campo `"source"` generado por el modelo.

---

# 6. Etapa 2 — Verification

Cada candidato descubierto debe pasar por una segunda etapa de verificación.

El objetivo de esta etapa es responder una única pregunta:

> ¿Este acontecimiento ocurrió realmente el día y mes consultados?

No debe buscar una nueva efeméride para reemplazar al candidato.

## Prompt de Verification

```js
const verificationPrompt = `
VERIFICACIÓN HISTÓRICA DE UNA EFEMÉRIDE MUSICAL

FECHA OBJETIVO:
${day} de ${monthName}

CANDIDATO:

Nombre:
${candidate.name}

Categoría:
${candidate.category}

Fecha indicada:
${candidate.claimedDay}/${candidate.claimedMonth}/${candidate.claimedYear}

Descripción:
${candidate.description}

TAREA:

Verificá mediante búsqueda web y fuentes confiables si este acontecimiento ocurrió EXACTAMENTE el ${day} de ${monthName}.

CONDICIONES OBLIGATORIAS:

1. El día real debe ser ${day}.
2. El mes real debe ser ${monthName}.
3. El año debe corresponder al acontecimiento.
4. La fuente debe respaldar específicamente el acontecimiento.
5. La fecha de publicación de la fuente NO cuenta como fecha del acontecimiento.

Si la fecha real es diferente, devolvé:

"verified": false

Si la fecha no puede confirmarse con claridad, devolvé:

"verified": false

Si existen fuentes contradictorias y no puede determinarse cuál es correcta, devolvé:

"verified": false

NO adivines.
NO infieras.
NO corrijas la fecha.
NO fuerces el resultado.
NO reemplaces este candidato por otro.

La única pregunta que debés resolver es:

¿El acontecimiento ocurrió realmente el ${day} de ${monthName}?

Devolvé únicamente JSON:

{
  "verified": true,
  "day": ${day},
  "month": ${month},
  "year": 0,
  "source": "",
  "evidence": ""
}

o:

{
  "verified": false,
  "day": ${day},
  "month": ${month},
  "year": 0,
  "source": "",
  "evidence": ""
}
`;
```

---

# 7. Verificación en batches

No es necesario hacer una llamada individual por cada candidato.

Si Discovery devuelve muchos candidatos, agruparlos en batches.

Ejemplo:

```text
20 candidatos
    ↓
Batch 1 → candidatos 1-10
Batch 2 → candidatos 11-20
    ↓
Resultados verificados
```

La respuesta puede ser:

```json
[
  {
    "candidate": "Isaac Delgado",
    "verified": false
  },
  {
    "candidate": "Otro artista",
    "verified": true,
    "year": 1978,
    "source": "Fuente real",
    "evidence": "La fuente indica explícitamente..."
  }
]
```

Esto reduce cantidad de requests.

---

# 8. Validación obligatoria en JavaScript

Nunca confiar únicamente en el modelo.

Después de la verificación:

```js
const verifiedResults = verificationResults.filter(result => {
  return (
    result.verified === true &&
    Number(result.day) === Number(day) &&
    Number(result.month) === Number(month)
  );
});
```

Esta validación debe ejecutarse antes de construir el resultado final.

Si Gemini devuelve:

```json
{
  "verified": true,
  "day": 19,
  "month": 8
}
```

cuando se solicitó:

```text
20 de agosto
```

el backend debe descartarlo automáticamente.

---

# 9. Construcción del resultado final

Solamente los candidatos verificados deben convertirse en el formato utilizado por GUTA MÚSICA.

Ejemplo:

```json
{
  "day": 20,
  "month": 8,
  "year": 1978,
  "title": "Título del acontecimiento",
  "description": "Descripción factual del acontecimiento.",
  "category": "nacimientos",
  "categoryLabel": "Nacimiento",
  "source": "Fuente utilizada para verificar",
  "impactBadge": "Figura Clave"
}
```

No utilizar el `"source"` del Discovery como fuente definitiva.

Utilizar la fuente obtenida durante Verification.

---

# 10. Categorías

No utilizar `"lanzamientos"` como categoría por defecto cuando se selecciona `"todas"`.

Actualmente NO hacer:

```js
category && category !== 'todas'
  ? category
  : 'lanzamientos'
```

Usar:

```js
const categoryFilter =
  category && category !== 'todas'
    ? category
    : null;
```

Cuando no hay categoría seleccionada, cada acontecimiento debe recibir su categoría real.

Ejemplos:

```json
{
  "category": "nacimientos",
  "categoryLabel": "Nacimiento"
}
```

```json
{
  "category": "fallecimientos",
  "categoryLabel": "Fallecimiento"
}
```

```json
{
  "category": "lanzamientos",
  "categoryLabel": "Lanzamiento discográfico"
}
```

```json
{
  "category": "conciertos",
  "categoryLabel": "Concierto"
}
```

Categorías sugeridas:

```text
nacimientos
fallecimientos
lanzamientos
canciones
obras
registros
estrenos
grabaciones
conciertos
festivales
bandas
industria
radio_tv
premios
otros
```

---

# 11. No limitar artificialmente los resultados

No imponer:

```text
1-4 resultados
```

El sistema debe poder devolver:

```text
0 resultados
```

```text
1 resultado
```

```text
10 resultados
```

```text
30 resultados
```

etc.

La cantidad debe depender de los acontecimientos que realmente puedan verificarse.

Regla:

> Es preferible devolver pocos resultados correctos que muchos resultados incorrectos.

Si no existe ningún acontecimiento verificable:

```json
[]
```

---

# 12. Fecha como restricción absoluta

La regla más importante de todo el sistema:

```text
requestedDay === eventDay
requestedMonth === eventMonth
```

La fecha de publicación de una fuente no debe considerarse.

Ejemplo:

```text
Fuente publicada: 20/08/2026
Acontecimiento: 15/08/1980

→ DESCARTAR
```

Ejemplo:

```text
Fuente publicada: 15/08/2026
Acontecimiento: 20/08/1980

→ VÁLIDO
```

---

# 13. No confundir diferentes fechas musicales

Para un álbum:

```text
grabación
anuncio
lanzamiento original
reedición
remasterización
```

son acontecimientos diferentes.

Para una obra:

```text
composición
registro
publicación
estreno
primera interpretación
primera grabación
```

son acontecimientos diferentes.

Para un concierto:

```text
anuncio
fecha programada
fecha real
retransmisión
```

son acontecimientos diferentes.

El sistema debe utilizar solamente la fecha correspondiente al acontecimiento descrito.

---

# 14. Relevancia

No incluir acontecimientos únicamente porque cumplen la fecha.

Priorizar:

* artistas relevantes;
* compositores importantes;
* discos históricos;
* canciones influyentes;
* conciertos memorables;
* festivales importantes;
* acontecimientos que marcaron carreras;
* hechos importantes para la música latinoamericana;
* hechos importantes para Brasil;
* acontecimientos de valor histórico o cultural.

---

# 15. Fuentes

Priorizar:

* sitios oficiales;
* archivos históricos;
* bibliotecas;
* museos;
* instituciones culturales;
* archivos musicales;
* discográficas;
* medios periodísticos reconocidos;
* publicaciones especializadas;
* bases de datos musicales;
* fuentes académicas;
* biografías confiables.

Para Brasil también buscar en portugués.

No confiar únicamente en sitios de efemérides o agregadores.

Si una fuente contradice otra, el candidato debe considerarse no verificado hasta poder resolver la contradicción.

---

# 16. Timeout

La búsqueda web puede necesitar más tiempo que la llamada actual.

Actualmente:

```js
AbortSignal.timeout(9000)
```

Se recomienda probar:

```js
AbortSignal.timeout(30000)
```

o, si la infraestructura lo permite:

```js
AbortSignal.timeout(45000)
```

No reducir el timeout para compensar problemas de rendimiento antes de medir el tiempo real de las búsquedas.

---

# 17. Temperature

Para una tarea histórica y factual:

```js
temperature: 0.1
```

o:

```js
temperature: 0.2
```

Evitar temperaturas altas.

La creatividad no es un objetivo de esta tarea.

La exactitud sí.

---

# 18. Flujo completo recomendado

Implementar:

```text
Usuario selecciona:
20 de agosto
       ↓
Backend
       ↓
Discovery
Gemini + Google Search
       ↓
Candidatos
       ↓
Verification
Gemini + Google Search
       ↓
Candidatos verificados
       ↓
Validación JavaScript
       ↓
Eliminar:
- fechas incorrectas
- categorías incorrectas
- duplicados
- resultados sin verificación
       ↓
Construcción del JSON final
       ↓
GUTA MÚSICA
```

---

# 19. Ejemplo del problema que debe solucionarse

Si Discovery devuelve:

```text
Isaac Delgado
Nacimiento
20 de agosto de 1942
```

Verification debe investigar el dato.

Si encuentra que su fecha real es diferente:

```json
{
  "verified": false
}
```

El resultado debe desaparecer.

No importa que Isaac Delgado sea un músico latinoamericano relevante.

La fecha no coincide → se descarta.

Lo mismo debe ocurrir con cualquier otro candidato.

---

# 20. Regla de oro

El sistema nunca debe preguntarse:

> "¿Qué músicos puedo relacionar con el 20 de agosto?"

Debe preguntarse:

> "¿Qué acontecimientos musicales ocurrieron REALMENTE el 20 de agosto y puedo demostrarlo mediante fuentes?"

Esta diferencia es fundamental.

---

# 21. Objetivo final

El sistema debe optimizar en este orden:

```text
1. Exactitud de fecha
2. Existencia real del acontecimiento
3. Calidad de las fuentes
4. Relevancia histórica
5. Cobertura geográfica
6. Cantidad de resultados
```

Nunca invertir este orden.

Un resultado falso es peor que un resultado faltante.

---

# 22. Cambios concretos solicitados al agente

Implementar los siguientes cambios:

* [ ] Incorporar Google Search grounding en las llamadas a Gemini, utilizando la sintaxis compatible con la API/modelo actualmente configurado.
* [ ] Separar Discovery y Verification.
* [ ] Crear un prompt específico para Discovery.
* [ ] Crear un prompt específico para Verification.
* [ ] Verificar el día y mes exactos de cada candidato.
* [ ] Utilizar Search grounding también durante Verification.
* [ ] Capturar y registrar `groundingMetadata`.
* [ ] No confiar en el campo `"source"` generado durante Discovery.
* [ ] Utilizar fuentes obtenidas durante Verification.
* [ ] Implementar validación adicional en JavaScript.
* [ ] Eliminar cualquier resultado cuyo `day` o `month` no coincida con la consulta.
* [ ] Eliminar resultados no verificados.
* [ ] Eliminar duplicados.
* [ ] Eliminar el límite artificial de 1-4 resultados.
* [ ] Permitir `[]`.
* [ ] Corregir el valor por defecto de `category`.
* [ ] Cuando `category === 'todas'`, permitir que cada resultado tenga su categoría real.
* [ ] Mantener las categorías consistentes.
* [ ] Reducir `temperature` a 0.1-0.2.
* [ ] Aumentar el timeout de 9 segundos a 30-45 segundos si la infraestructura lo permite.
* [ ] Mantener `responseMimeType: 'application/json'`.
* [ ] No cambiar la autenticación ni el modelo existente sin verificar primero la API utilizada.
* [ ] Mantener el JSON final compatible con el frontend actual.

## Resultado esperado

El sistema debe preferir:

```json
[]
```

antes que devolver una efeméride con fecha incorrecta.

La fecha consultada debe ser una restricción absoluta y debe verificarse mediante fuentes reales antes de que un acontecimiento pueda llegar al resultado final.
