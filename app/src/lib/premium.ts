import { Usuario } from '@/lib/api';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

// FitFat Premium: personalized motivational messages at the chosen times.
// (Demo: it is activated for free; there is no real payment.)
export type Premium = { activo: boolean; horas: string[]; opciones: string[] };

export const cargarPremium = () => apiConSesion<Premium>('GET', '/premium');

export async function guardarPremium(activo: boolean, horas: string[]) {
  const r = await apiConSesion<Premium & { usuario: Usuario }>('PUT', '/premium', { activo, horas });
  actualizarUsuario(r.usuario);
  return r;
}
