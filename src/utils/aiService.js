import { GoogleGenerativeAI } from "@google/generative-ai";

export async function checkApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("Clave API de Gemini no configurada. Ve a Ajustes.");
  }
}

function getGeminiModel(apiKey) {
  checkApiKey(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

// 1. Llenado Mágico (WhatsApp to Items)
export async function parseWhatsAppToItems(text, apiKey, options = {}) {
  const model = getGeminiModel(apiKey);
  
  const prompt = `
Eres un asistente experto en un cotizador de cortinas. 
El vendedor ha pegado el siguiente texto copiado de WhatsApp u otra nota.
Tu trabajo es interpretarlo y extraer una lista estructurada de persianas/cortinas a cotizar.
Puede que vengan enumeradas, o con dimensiones como ancho x alto (o al reves, usa tu logica para identificar, normalmente es ancho x alto en metros o cm. Convierte cm a Metros siempre, ej. 136cm = 1.36). 
Normalmente se asume 1 cantidad por renglón. 

Opciones pre-seleccionadas por el vendedor (si aplica a todas las descubiertas): 
- Tipo / Ubicación / Notas extra: ${options.notas || 'No especificado'}

Devuelve la respuesta ESTRICTAMENTE en formato JSON como un arreglo de objetos validos. Nada de texto markdown, solo JSON natural \`[...]\` sin bloque \`\`\`json.
Ejemplo de salida:
[
  { "cantidad": 1, "ancho": 2.30, "alto": 3.14, "ubicacion": "1", "tipo": "Persiana", "detalles": "" }
]

TEXTO DEL USUARIO:
"""
${text}
"""
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Error al procesar texto con IA:", error);
    throw new Error("No se pudo procesar el texto. Verifica que la API Key sea correcta o intenta denuevo.");
  }
}

// 2. Mensajes Seguimiento
export async function generateFollowUpMessage(quoteData, totals, apiKey, tipoMensaje = "seguimiento") {
  const model = getGeminiModel(apiKey);
  const cliente = quoteData.cliente || "Cliente";
  const vendedor = quoteData.vendedor?.nombre || quoteData.vendedor || "tu Asesor";
  
  const instruccionesRol = tipoMensaje === 'envio'
    ? `Escribe un mensaje persuasivo, profesional y amable para enviar por WhatsApp al cliente entregándole su cotización por primera vez para que la revise.`
    : `Escribe un mensaje persuasivo, profesional y amable de SEGUIMIENTO para enviar por WhatsApp. Pregúntale qué le pareció la cotización que se le envió hace unos días o si tiene alguna duda, incitándolo suavemente a avanzar con paso a la compra.`;

  const prompt = `
Eres el mejor asistente de ventas de una empresa de persianas y cortinas.
${instruccionesRol}
Mantenlo corto (3-4 renglones máximo), evita ser pesado, usa emojis sutiles y preséntate como ${vendedor}.

Datos de la cotización:
- Cliente: ${cliente}
- Total a pagar: $${(totals?.totalFinal || 0).toFixed(2)}
- Tiene aplicado un descuento de: ${quoteData.descuentoPorcentaje || 0}%

Redacta el texto directo al grano para copiar y pegar al chat del cliente. NO uses placeholders como [Nombre], reemplázalo tú.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error(error);
    throw new Error("No se pudo redactar el mensaje.");
  }
}

// 3. Analista Estadístico
export async function analyzeBusinessStats(historico, apiKey) {
  const model = getGeminiModel(apiKey);
  
  const totalEnviadas = historico.length;
  const aprobadas = historico.filter(c => c.status === "aprobada");
  const dineroCerrado = aprobadas.reduce((sum, c) => sum + (c.totals?.totalFinal || 0), 0);
  
  const telas = {};
  historico.forEach(c => {
    (c.items || []).forEach(i => {
      const nom = i.descripcion || "Sin especificar";
      telas[nom] = (telas[nom] || 0) + 1;
    });
  });

  const prompt = `
Eres un asesor de ventas experto. Basado en estos datos de mi pequeña empresa de cortinas:
- Enviadas: ${totalEnviadas}
- Cerradas: ${aprobadas.length}
- Dinero Cerrado: $${dineroCerrado}
- Telas cotizadas frecuecia: ${JSON.stringify(telas)}

Dame un análisis directo y al grano (Formateado en HTML listo para inyectarse <div class="space-y-2">, <h3>, <ul>, y <b> pero SIN tags <html> ni <body> ni bloques \`\`\`html). 
Incluye:
1. Tasa de conversión y un renglón si es buena.
2. ¿Cuál es la tela estrella de rotación?
3. Un consejo inteligente (sólo uno) y super accionable para aumentar el nivel de ventas con los clientes que quedan a medias.
Usa tono entusiasta, profesional e incluye emojis corporativos.
  `;

  try {
    const result = await model.generateContent(prompt);
    const cleaned = result.response.text().replace(/```html/gi, '').replace(/```/gi, '').trim();
    return cleaned;
  } catch (error) {
    console.error(error);
    throw new Error("Error analizando las estadísticas con Inteligencia Artificial.");
  }
}
