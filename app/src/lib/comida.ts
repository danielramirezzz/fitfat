import { Usuario } from '@/lib/api';
import { actualizarUsuario, apiConSesion } from '@/lib/sesion';

export type Categoria = 'cereal' | 'proteina' | 'verdura' | 'fruta' | 'otro';
export type Alimento = { nombre: string; porcion: string; categoria: Categoria };
export type ClaveComida = 'desayuno' | 'almuerzo' | 'cena' | 'snack';
export type Habitos = { agua: number; sueno: number; ejercicio: boolean };

export const PESTANAS: { clave: ClaveComida; nombre: string }[] = [
  { clave: 'desayuno', nombre: 'Desayuno' },
  { clave: 'almuerzo', nombre: 'Almuerzo' },
  { clave: 'cena', nombre: 'Cena' },
  { clave: 'snack', nombre: 'Snack' },
];

export type DatosHoy = {
  fecha: string;
  comidas: Record<ClaveComida, Alimento[]>;
  habitos: Habitos;
  metaAgua: number;
};

export type ResultadoRegistro = {
  puntosGanados: number;
  racha: { antes: number; ahora: number };
  comidasHoy: number;
  usuario: Usuario;
};

export type ComidaPlan = {
  clave: 'desayuno' | 'media' | 'almuerzo' | 'cena';
  nombre: string;
  hora: string;
  registro: ClaveComida;
  plato: string;
  detalle: string;
  hecho: boolean;
  ahora: boolean;
};

export type DiaSemana = { fecha: string; dia: string; numero: number; hoy: boolean; futuro: boolean; registrado: boolean };

export type DatosPlan = {
  objetivo: string | null;
  fecha: string;
  semana: DiaSemana[];
  comidas: ComidaPlan[];
  hechas: number;
  total: number;
};

// The meal that fits the current hour (to open the right tab).
export function comidaSegunHora(h = new Date().getHours()): ClaveComida {
  if (h < 10) return 'desayuno';
  if (h < 12) return 'snack';
  if (h < 16) return 'almuerzo';
  return 'cena';
}

let ultimoResultado: ResultadoRegistro | null = null;
export const obtenerResultadoRegistro = () => ultimoResultado;

export const cargarHoy = () => apiConSesion<DatosHoy>('GET', '/comida/hoy');

export const buscarAlimentos = (q: string) =>
  apiConSesion<{ resultados: Alimento[] }>('GET', `/alimentos?q=${encodeURIComponent(q)}`);

export const cargarPlan = (fecha?: string) =>
  apiConSesion<DatosPlan>('GET', `/comida/plan${fecha ? `?fecha=${fecha}` : ''}`);

export async function guardarRegistro(comida: ClaveComida, alimentos: Alimento[], habitos: Habitos) {
  const r = await apiConSesion<ResultadoRegistro>('POST', '/comida/registro', { comida, alimentos, habitos });
  actualizarUsuario(r.usuario);
  ultimoResultado = r;
  return r;
}
