import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Usuario } from '@/lib/api';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

export type TipoAlerta = 'entrenamiento' | 'agua' | 'comidas' | 'dormir' | 'pesaje' | 'motivacion';
export type Frecuencia = 'diaria' | 'semana' | 'fines';

export type ConfigAlertas = {
  push: boolean;
  correo: boolean;
  sms: boolean;
  tipos: TipoAlerta[];
  hora: string; // "HH:MM"
  frecuencia: Frecuencia;
  guardada: boolean;
};

export type Notificacion = {
  id: number;
  tipo: string;
  titulo: string;
  cuerpo: string;
  creadaEn: string; // ISO date
  leida: boolean;
};

export const TIPOS: { clave: TipoAlerta; nombre: string; tip: string }[] = [
  { clave: 'entrenamiento', nombre: 'Entrenamiento', tip: 'Entrena siempre a la misma hora.' },
  { clave: 'agua', nombre: 'Tomar agua', tip: 'Ten una botella de agua siempre a la mano.' },
  { clave: 'comidas', nombre: 'Comidas', tip: 'Come a horas fijas para evitar antojos.' },
  { clave: 'dormir', nombre: 'Dormir', tip: 'Acuéstate a la misma hora todos los días.' },
  { clave: 'pesaje', nombre: 'Pesaje semanal', tip: 'Pésate el mismo día y a la misma hora.' },
  { clave: 'motivacion', nombre: 'Motivación', tip: 'Celebra cada pequeño logro.' },
];

export const FRECUENCIAS: { clave: Frecuencia; nombre: string }[] = [
  { clave: 'diaria', nombre: 'Todos los días' },
  { clave: 'semana', nombre: 'Lunes a viernes' },
  { clave: 'fines', nombre: 'Fines de semana' },
];

// "07:30" → "7:30 a. m."
export function horaBonita(hora: string) {
  const [h, m] = hora.split(':').map(Number);
  const sufijo = h < 12 ? 'a. m.' : 'p. m.';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${sufijo}`;
}

// Every 5 minutes from 5:00 a. m. to 11:55 p. m. (fine enough to set a reminder
// "in 5 minutes" during a demo).
export const HORAS = Array.from({ length: (24 - 5) * 12 }, (_, i) => {
  const minutos = 5 * 60 + i * 5;
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
});

let resultadoGuardado: { puntosGanados: number } | null = null;
export const obtenerResultadoAlertas = () => resultadoGuardado;

export const cargarConfig = () => apiConSesion<ConfigAlertas>('GET', '/alertas');

export async function guardarConfig(c: Omit<ConfigAlertas, 'guardada'>) {
  const r = await apiConSesion<{ config: ConfigAlertas; puntosGanados: number; usuario: Usuario }>('PUT', '/alertas', c);
  actualizarUsuario(r.usuario);
  resultadoGuardado = { puntosGanados: r.puntosGanados };
  return r;
}

export const cargarNotificaciones = () =>
  apiConSesion<{ notificaciones: Notificacion[]; noLeidas: number }>('GET', '/notificaciones');

export const marcarLeidas = () => apiConSesion('POST', '/notificaciones/leidas', {});

// --- Local reminders on the phone (expo-notifications) ---------------------------------

// Show reminders even while the app is open.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const MENSAJES: Record<TipoAlerta, { title: string; body: string }> = {
  entrenamiento: { title: '¡Hora de entrenar! 🔥', body: 'Tu fueguito te está esperando. Una rutina rápida y listo.' },
  agua: { title: 'Hora de tomar agua 💧', body: 'Un vaso de agua ahora te acerca a tu meta de 8.' },
  comidas: { title: 'Registra tus comidas 🍎', body: 'Solo te toma 1 minuto y mantiene viva tu racha.' },
  dormir: { title: 'Hora de descansar 🌙', body: 'Dormir bien también es entrenar.' },
  pesaje: { title: 'Pesaje semanal ⚖️', body: 'Registra tu peso para ver tu progreso.' },
  motivacion: { title: 'Tú eres tu único rival 💪', body: 'Cada día cuenta. ¡Hoy también!' },
};

// Weekdays for expo-notifications: 1 = Sunday ... 7 = Saturday.
const DIAS: Record<Frecuencia, number[] | null> = { diaria: null, semana: [2, 3, 4, 5, 6], fines: [1, 7] };

export type EstadoRecordatorios = 'programados' | 'apagados' | 'sin-permiso' | 'web';

// Replaces all scheduled reminders with the new settings. One per type,
// staggered 2 minutes so they don't arrive all at once.
export async function programarRecordatorios(c: Omit<ConfigAlertas, 'guardada'>): Promise<EstadoRecordatorios> {
  if (Platform.OS === 'web') return 'web';
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!c.push || c.tipos.length === 0) return 'apagados';

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return 'sin-permiso';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('recordatorios', {
      name: 'Recordatorios',
      // The lint import plugin can't follow this nested re-export; TypeScript confirms it exists.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const [h, m] = c.hora.split(':').map(Number);
  for (const [i, tipo] of c.tipos.entries()) {
    const total = h * 60 + m + i * 2;
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    // Weekly weigh-in: only on Mondays, whatever the frequency.
    const dias = tipo === 'pesaje' ? [2] : DIAS[c.frecuencia];
    const triggers: Notifications.NotificationTriggerInput[] = dias
      ? dias.map((weekday) => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId: 'recordatorios' }))
      : [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: 'recordatorios' }];
    for (const trigger of triggers) {
      await Notifications.scheduleNotificationAsync({ content: MENSAJES[tipo], trigger });
    }
  }
  // FitFat Premium: a daily motivational reminder at each chosen time.
  const premium = await apiConSesion<{ activo: boolean; horas: string[] }>('GET', '/premium').catch(() => null);
  if (premium?.activo) {
    for (const hora of premium.horas) {
      const [ph, pm] = hora.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: { title: 'FitFat Premium 👑', body: 'Tu mensaje motivacional te espera. ¡Tú eres tu único rival!' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: ph, minute: pm, channelId: 'recordatorios' },
      });
    }
  }
  return 'programados';
}
