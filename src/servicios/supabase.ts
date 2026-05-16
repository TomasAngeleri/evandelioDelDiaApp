import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto y clave pública para consultar la base de datos
const URL_SUPABASE = 'https://wjzohhocfqtfxatuigfb.supabase.co';
const CLAVE_PUBLICA = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqem9oaG9jZnF0ZnhhdHVpZ2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjA2NzksImV4cCI6MjA5MjE5NjY3OX0.HsuzjSp1j29x7wcxWiy3safIZ2Q0K8chIvEGRzGW-zY'; // Reemplaza esto con tu anon key

export const supabase = createClient(URL_SUPABASE, CLAVE_PUBLICA);

// Interfaz TypeScript para mantener el tipado estricto
export interface LecturaDiaria {
  id: string;
  fecha: string;
  evangelio: string;
  reflexion_ia: string;
}

// Función que la interfaz llamará para traer los datos
export const obtenerLecturaDelDia = async (): Promise<LecturaDiaria | null> => {
  const fechaHoy = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lecturas_diarias')
    .select('*')
    .eq('fecha', fechaHoy)
    .maybeSingle();

  if (error) {
    console.error("Error al obtener la lectura desde Supabase:", error.message);
    return null;
  }

  return data as LecturaDiaria;
};