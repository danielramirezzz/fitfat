import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

// "Continuar con Google" in demo mode. Real Google sign-in needs an OAuth client
// registered in Google Cloud; meanwhile the person types their name and Gmail
// once, and this device remembers it to show it in "Elige una cuenta".

export type CuentaGoogle = { nombre: string; correo: string };

const CLAVE = 'fitfat_google_cuentas';

export async function cuentasRecordadas(): Promise<CuentaGoogle[]> {
  try {
    const t = Platform.OS === 'web' ? globalThis.localStorage?.getItem(CLAVE) : await SecureStore.getItemAsync(CLAVE);
    return t ? (JSON.parse(t) as CuentaGoogle[]) : [];
  } catch {
    return [];
  }
}

// Puts the account first (most recent) and keeps at most 3.
export async function recordarCuenta(c: CuentaGoogle) {
  const lista = [c, ...(await cuentasRecordadas()).filter((x) => x.correo !== c.correo)].slice(0, 3);
  const t = JSON.stringify(lista);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(CLAVE, t);
  else await SecureStore.setItemAsync(CLAVE, t).catch(() => {});
}

// --- Real Google (when the server has GOOGLE_CLIENT_ID) -------------------------------------

export type ConfigServidor = { googleClientId: string | null; correoReal: boolean };

export const cargarConfigServidor = () => api<ConfigServidor>('GET', '/config');

// The ID token from Google's button travels to "Validar autenticación" through here
// (it is too long and too private for the URL).
let credencial: string | null = null;
export const guardarCredencial = (c: string) => {
  credencial = c;
};
export const tomarCredencial = () => {
  const c = credencial;
  credencial = null;
  return c;
};
