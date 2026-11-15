import { Usuario } from '@/lib/api';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

export type DiaRacha = { fecha: string; letra: string; activo: boolean; hoy: boolean };

export type DatosInicio = {
  usuario: Usuario;
  racha: { dias: number; hoyActivo: boolean; semana: DiaRacha[] };
  comidas: { hoy: number; meta: number };
  alertasActivas: number;
  notificacionesNoLeidas: number;
  cambioPesoKg: number | null;
};

// Everything the Home screen shows, in one request (GET /api/inicio).
export async function cargarInicio(): Promise<DatosInicio> {
  const datos = await apiConSesion<DatosInicio>('GET', '/inicio');
  actualizarUsuario(datos.usuario);
  return datos;
}

// Persuasive message under the streak title.
export function mensajeRacha(dias: number, hoyActivo: boolean): string {
  if (hoyActivo) return '¡Ya entrenaste hoy! Vuelve mañana para que tu fueguito siga creciendo.';
  if (dias > 0) return '¡Estás que ardes! Entrena hoy para no apagar tu fueguito.';
  return 'Tu fueguito está apagado. Entrena hoy para encenderlo.';
}
