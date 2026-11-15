import { api } from '@/lib/api';

// "Recuperar contraseña" flow: Recuperar → Verificar código → Nueva → Actualizada.
// What the screens share lives here (in memory, only while the flow lasts).
type Flujo = { correo: string; destino: string; codigoDemo?: string; token?: string };
let flujo: Flujo | null = null;

export const obtenerFlujo = () => flujo;

export async function pedirCodigo(correo: string) {
  const r = await api<{ destino: string; codigoDemo?: string }>('POST', '/recuperar', { correo });
  flujo = { correo, ...r };
  return flujo;
}

export async function verificarCodigo(codigo: string) {
  if (!flujo) throw new Error('Vuelve a empezar la recuperación.');
  const r = await api<{ token: string }>('POST', '/recuperar/verificar', { correo: flujo.correo, codigo });
  flujo = { ...flujo, token: r.token };
}

export async function guardarNuevaContrasena(contrasena: string) {
  if (!flujo?.token) throw new Error('Vuelve a empezar la recuperación.');
  await api('POST', '/recuperar/nueva', { token: flujo.token, contrasena });
  flujo = null;
}

// Same checklist as the "Nueva contraseña" screen in Figma.
export function reglasContrasena(nueva: string, repetir: string) {
  return [
    { texto: 'Mínimo 8 caracteres', ok: nueva.length >= 8 },
    { texto: 'Al menos un número', ok: /\d/.test(nueva) },
    { texto: 'Las contraseñas coinciden', ok: nueva.length > 0 && nueva === repetir },
  ];
}
