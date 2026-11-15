// Design tokens for FitFat, taken from the Figma file.

export const Colores = {
  verde: '#1EFF3C', // main actions, active state, achievements
  verdeSuave: 'rgba(30, 255, 60, 0.15)', // active tab pill

  fondo: '#0D0D0D',
  fondo2: '#161616',
  tarjeta: '#1C1C1E',
  borde: '#3A3A3C',
  bordeBarra: '#262626',

  degradadoArriba: '#2A2A2A', // screen background: #2A2A2A -> #000000 at 30%
  degradadoAbajo: '#000000',

  rojo: '#FF3B30', // errors, sign out, cancel
  fuegoClaro: '#FFC93C', // streak (the "fueguito")
  fuegoOscuro: '#FF6A1F',

  texto: '#FFFFFF',
  textoSecundario: '#B8B8B8',
  textoApagado: '#8F8F8F',
  textoClaro: '#C4C4C4', // subtitles on access screens
  placeholder: '#9A9A9A',

  campo: '#2C2C2C', // text field background
  chip: '#3D3C3C',
  bordeTarjeta: '#2A2A2A',
  botonApagado: '#1F4A28', // disabled green button
  textoBotonApagado: '#7DBF87',
};

// Font names as registered with useFonts in src/app/_layout.tsx
export const Fuentes = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extraBold: 'Montserrat_800ExtraBold',
  etiqueta: 'Freeman_400Regular', // labels, buttons, tabs, chips
};

export const Radios = {
  tarjeta: 16,
  boton: 26,
};

export const ALTO_BOTON = 52;
export const ALTO_BARRA = 80;
