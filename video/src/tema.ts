import { loadFont as cargarFreeman } from '@remotion/google-fonts/Freeman';
import { loadFont as cargarMontserrat } from '@remotion/google-fonts/Montserrat';

// Same design tokens as the app (app/src/constants/theme.ts).
export const C = {
  verde: '#1EFF3C',
  verdeOscuro: '#0F2E14',
  fondo: '#0D0D0D',
  tarjeta: '#1C1C1E',
  borde: '#2A2A2A',
  rojo: '#FF3B30',
  fuegoClaro: '#FFC93C',
  fuegoOscuro: '#FF6A1F',
  dorado: '#FFC93C',
  texto: '#FFFFFF',
  gris: '#B8B8B8',
  grisOscuro: '#8F8F8F',
  azul: '#4A9EFF',
  morado: '#A259FF',
};

export const montserrat = cargarMontserrat('normal', {
  weights: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'latin-ext'],
}).fontFamily;
export const freeman = cargarFreeman('normal', { weights: ['400'], subsets: ['latin', 'latin-ext'] }).fontFamily;

export const FPS = 30;
export const s = (segundos: number) => Math.round(segundos * FPS);
