import { useEffect, useState } from 'react';
import { obtenerLecturaDelDia } from './servicios/supabase';
import type { LecturaDiaria } from './servicios/supabase';
import { configurarNotificacionDiaria } from './servicios/notificaciones';

function App() {
  const [lectura, establecerLectura] = useState<LecturaDiaria | null>(null);
  const [cargando, establecerCargando] = useState<boolean>(true);

  useEffect(() => {
    // Función asíncrona para iniciar la app
    const inicializarApp = async () => {
      // Configuramos la notificación en segundo plano
      await configurarNotificacionDiaria();
      
      // Traemos el Evangelio de Supabase
      const datosHoy = await obtenerLecturaDelDia();
      establecerLectura(datosHoy);
      establecerCargando(false);
    };

    inicializarApp();
  }, []);

  // Vista de carga
  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>Cargando el Evangelio de hoy...</p>
      </div>
    );
  }

  // Vista de error o falta de datos
  if (!lectura) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <h2 style={{ color: '#e74c3c' }}>Aún no hay lectura disponible</h2>
        <p style={{ color: '#7f8c8d' }}>El proceso de madrugada todavía no se ha ejecutado o no tienes conexión a internet.</p>
      </div>
    );
  }

  // Vista Principal Exitosa
  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f9fbfd', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px', paddingTop: '20px' }}>
        <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Evangelio del Día</h1>
        <p style={{ color: '#7f8c8d', fontSize: '0.9rem', fontWeight: 'bold' }}>{lectura.fecha}</p>
      </header>

      <section style={{ backgroundColor: '#ffffff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h2 style={{ color: '#34495e', borderBottom: '2px solid #ecf0f1', paddingBottom: '10px', marginTop: 0 }}>Lectura</h2>
        <p style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#2c3e50', fontSize: '1.05rem' }}>
          {lectura.evangelio}
        </p>
      </section>

      <section style={{ backgroundColor: '#e8f4f8', padding: '25px', borderRadius: '12px', border: '1px solid #bde0ec' }}>
        <h2 style={{ color: '#2980b9', borderBottom: '2px solid #bde0ec', paddingBottom: '10px', marginTop: 0 }}>Reflexión</h2>
        <p style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap', color: '#1a5276', fontSize: '1.05rem' }}>
          {lectura.reflexion_ia}
        </p>
      </section>
    </main>
  );
}

export default App;