import { LocalNotifications } from '@capacitor/local-notifications';

export const configurarNotificacionDiaria = async () => {
  try {
    // 1. Solicitar permisos al usuario (Obligatorio en iOS y Android 13+)
    const permisos = await LocalNotifications.requestPermissions();
    
    if (permisos.display !== 'granted') {
      console.warn("El usuario denegó los permisos de notificación.");
      return;
    }

    // 2. Limpiar notificaciones previas para evitar duplicados
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

    // 3. Programar la nueva notificación
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Tu Evangelio Diario 🕊️',
          body: 'La lectura y reflexión de hoy ya están disponibles. Tómate un momento de paz.',
          id: 1, 
          schedule: {
            on: { hour: 9, minute: 0 }, 
            allowWhileIdle: true, 
          },
          actionTypeId: '',
          extra: null,
        },
      ],
    });
    
    console.log("Notificación programada con éxito.");
  } catch (error) {
    console.error("Error al configurar notificaciones (normal si estás en navegador web):", error);
  }
};