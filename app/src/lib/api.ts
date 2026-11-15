import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Address of the FitFat backend. The app talks to the Expo server (port 8081),
// which forwards /api/... to the backend on port 3000 (src/app/api/[...ruta]+api.ts).
// That way only port 8081 has to be reachable from the phone.
// - Browser: same address as the page.
// - Phone with Expo Go: hostUri = "IP-of-the-PC:8081".
// - EXPO_PUBLIC_API_URL overrides both (e.g. http://192.168.1.10:3000/api).
function urlBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/api`;
  return `http://${Constants.expoConfig?.hostUri ?? 'localhost:8081'}/api`;
}

export const API_URL = urlBase();

// Error with the HTTP status, so screens can tell "wrong password" (401)
// apart from "server not reachable" (estado 0).
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public estado: number,
  ) {
    super(mensaje);
  }
}

export type Usuario = {
  id: number;
  usuario: string;
  nombre: string | null;
  fechaNacimiento: string | null;
  genero: string | null;
  estatura: number | null;
  peso: number | null;
  objetivo: string | null;
  correo: string | null;
  puntos: number;
  perfilCompleto: boolean;
};

export async function api<T>(metodo: string, ruta: string, cuerpo?: unknown, token?: string | null): Promise<T> {
  const control = new AbortController();
  const limite = setTimeout(() => control.abort(), 8000);
  let respuesta: Response;
  try {
    respuesta = await fetch(API_URL + ruta, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: control.signal,
    });
  } catch {
    throw new ErrorApi(
      'No pudimos conectar con el servidor. Revisa que esté encendido y que el celular y el PC estén en el mismo Wi-Fi.',
      0,
    );
  } finally {
    clearTimeout(limite);
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new ErrorApi(datos.error ?? 'Algo salió mal.', respuesta.status);
  return datos as T;
}
