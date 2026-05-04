import { createClient } from 'npm:@supabase/supabase-js@2'
import Parser from 'npm:rss-parser'

const procesadorRss = new Parser();

// --- FUNCIÓN AUXILIAR REUTILIZABLE ---
// Intenta descargar un RSS con un límite de 8 segundos. Si falla, lanza un error.
async function intentarDescargaRss(urlRss: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  
  const respuestaHttp = await fetch(urlRss, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!respuestaHttp.ok) throw new Error(`El servidor devolvió HTTP ${respuestaHttp.status}`);
  
  const xmlCrudo = await respuestaHttp.text();
  const feed = await procesadorRss.parseString(xmlCrudo);
  
  if (!feed.items || feed.items.length === 0) throw new Error("El RSS vino vacío.");
  
  const itemHoy = feed.items[0];
  return `${itemHoy.title ?? ""} - ${itemHoy.contentSnippet ?? ""}`.replace(/<[^>]*>?/gm, '');
}


Deno.serve(async (req) => {
  try {
    const URL_SUPABASE = Deno.env.get('SUPABASE_URL') ?? '';
    const CLAVE_SERVICIO = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const CLAVE_GEMINI = Deno.env.get('CLAVE_API_GEMINI') ?? '';

    const supabase = createClient(URL_SUPABASE, CLAVE_SERVICIO);
    const fechaDeHoy = new Date().toISOString().split('T')[0];

    // --- BLOQUE 1: OBTENER LA CITA CON PATRÓN DE CASCADA (WATERFALL) ---
    let pistaEvangelio = "";
    
    try {
      console.log("Intento 1: Servidor Principal (Catholic.net)...");
      pistaEvangelio = await intentarDescargaRss('https://es.catholic.net/rss/evangelio.xml');
    } catch (error1) {
      console.warn(`Intento 1 falló (${error1.message}). Pasando al servidor de respaldo...`);
      
      try {
        console.log("Intento 2: Servidor de Respaldo (Ciudad Redonda)...");
        // Usamos un segundo feed católico estable
        pistaEvangelio = await intentarDescargaRss('https://www.ciudadredonda.org/rss/evangelio.xml');
      } catch (error2) {
        console.warn(`Intento 2 falló (${error2.message}). Servidores externos caídos. Activando contingencia de IA.`);
        
        // Plan C: Si absolutamente todos los servidores RSS fallan, le pedimos a la IA que nos salve.
        pistaEvangelio = "Los servidores litúrgicos están caídos hoy. Por favor, selecciona un pasaje fundamental y conocido de Jesucristo (por ejemplo del Sermón del Monte o una parábola importante) como lectura de contingencia para hoy.";
      }
    }

    // --- BLOQUE 2: GEMINI COMO FUENTE BÍBLICA Y REFLEXIÓN ---
    console.log("Solicitando texto completo y reflexión a Gemini en formato JSON...");
    const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CLAVE_GEMINI}`;

    const instruccion = `Eres un experto en liturgia católica. La instrucción para el Evangelio de hoy es: "${pistaEvangelio}". 
Devuelve un objeto JSON estricto con dos propiedades:
1. "evangelio_completo": El texto bíblico exacto y completo. Si la instrucción te pide contingencia, proporciona el texto bíblico de tu elección.
2. "reflexion": Una breve reflexión empática de máximo 2 párrafos sobre ese texto, aplicable al día a día.`;

    const respuestaGemini = await fetch(urlGemini, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instruccion }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const datosIa = await respuestaGemini.json();
    if (!respuestaGemini.ok) throw new Error(`Google API rechazó la petición: ${JSON.stringify(datosIa)}`);
    
    const respuestaTexto = datosIa.candidates[0].content.parts[0].text;
    const datosGenerados = JSON.parse(respuestaTexto);

    const textoCompletoFinal = datosGenerados.evangelio_completo;
    const reflexionFinal = datosGenerados.reflexion;

    // --- BLOQUE 3: GUARDAR EN BASE DE DATOS ---
    const { error: errorBd } = await supabase
      .from('lecturas_diarias')
      .insert([{ 
        evangelio: textoCompletoFinal, 
        reflexion_ia: reflexionFinal, 
        fecha: fechaDeHoy 
      }]);

    if (errorBd) {
      if (errorBd.code === '23505') {
        return new Response(JSON.stringify({ mensaje: "La lectura ya estaba procesada para el día de hoy." }), { status: 200 });
      }
      throw new Error(`Fallo al guardar en la base de datos: ${errorBd.message}`);
    }

    return new Response(
      JSON.stringify({ mensaje: "¡Proceso completado exitosamente con sistema de respaldo!" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (errorGeneral: any) {
    console.error("Error crítico de sistema:", errorGeneral.message);
    return new Response(
      JSON.stringify({ error: "Fallo general en la función", detalle: errorGeneral.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});