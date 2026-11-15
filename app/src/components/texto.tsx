import { StyleSheet, Text as TextoRN, TextProps } from 'react-native';

import { Colores } from '@/constants/theme';
import { useAccesibilidad } from '@/lib/accesibilidad';

// Gray texts that become almost white with "Alto contraste".
const GRISES = new Set(
  [Colores.textoSecundario, Colores.textoApagado, Colores.textoClaro, Colores.placeholder, '#8E8E93', '#A0A0A0'].map(
    (c) => c.toUpperCase(),
  ),
);

// Drop-in replacement for React Native's Text (same name, so screens only
// change the import). It applies the accessibility preferences: bigger text
// and high contrast.
export function Text({ style, ...props }: TextProps) {
  const { escala, contraste } = useAccesibilidad();
  if (escala === 1 && !contraste) return <TextoRN style={style} {...props} />;

  const plano = StyleSheet.flatten(style) ?? {};
  const extra: Record<string, unknown> = {};
  if (escala !== 1) {
    extra.fontSize = (plano.fontSize ?? 14) * escala;
    if (typeof plano.lineHeight === 'number') extra.lineHeight = plano.lineHeight * escala;
  }
  if (contraste && typeof plano.color === 'string' && GRISES.has(plano.color.toUpperCase())) {
    extra.color = '#F2F2F2';
  }
  return <TextoRN style={[style, extra]} {...props} />;
}
