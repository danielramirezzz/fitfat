import { ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { Text } from '@/components/texto';
import { IconoVolver } from '@/components/iconos-acceso';
import { ALTO_BOTON, Colores, Fuentes, Radios } from '@/constants/theme';

// Small reusable pieces shared by many screens.

type BotonProps = {
  texto: string;
  onPress: () => void;
  variante?: 'verde' | 'blanco' | 'gris';
  deshabilitado?: boolean;
  icono?: ReactNode; // shown to the right of the text
  izquierda?: ReactNode; // shown to the left of the text
  estilo?: ViewStyle;
};

// Pill button (height 52, radius 26). Freeman 19 text.
export function Boton({ texto, onPress, variante = 'verde', deshabilitado, icono, izquierda, estilo }: BotonProps) {
  const fondo = deshabilitado
    ? Colores.botonApagado
    : { verde: Colores.verde, blanco: '#FFFFFF', gris: Colores.campo }[variante];
  const colorTexto = deshabilitado ? Colores.textoBotonApagado : variante === 'gris' ? '#FFFFFF' : '#000000';
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!deshabilitado }}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: fondo },
        variante === 'gris' && styles.botonGris,
        pressed && styles.presionado,
        estilo,
      ]}>
      {izquierda}
      <Text style={[styles.textoBoton, { color: colorTexto }]}>{texto}</Text>
      {icono}
    </Pressable>
  );
}

type CampoProps = TextInputProps & {
  etiqueta: string;
  icono?: ReactNode; // left icon
  iconoDerecha?: ReactNode;
  error?: string;
};

// Labeled text field: Freeman label + dark pill (height 48) with a gray icon.
export function CampoTexto({ etiqueta, icono, iconoDerecha, error, style, ...props }: CampoProps) {
  return (
    <View>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <View style={[styles.campo, !!error && styles.campoError]}>
        {icono ? <View style={styles.iconoCampo}>{icono}</View> : null}
        <TextInput
          placeholderTextColor={Colores.placeholder}
          style={[styles.input, !icono && { paddingLeft: 24 }, style]}
          {...props}
        />
        {iconoDerecha ? <View style={styles.iconoDerecha}>{iconoDerecha}</View> : null}
      </View>
      {error ? <Text style={styles.textoError}>{error}</Text> : null}
    </View>
  );
}

// Round back button (44px) used at the top-left of step screens.
export function BotonVolver({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={8}>
      <IconoVolver />
    </Pressable>
  );
}

// Step progress bar (height 6). `avance` goes from 0 to 1.
export function BarraPaso({ avance }: { avance: number }) {
  return (
    <View style={styles.barraFondo}>
      <View style={[styles.barraLlena, { width: `${avance * 100}%` }]} />
    </View>
  );
}

// White-bordered dark card used by Error / Usuario creado / Usuario no creado.
export function TarjetaAviso({ children, estilo }: { children: ReactNode; estilo?: ViewStyle }) {
  return <View style={[styles.tarjetaAviso, estilo]}>{children}</View>;
}

type ChipProps ={ texto: string; activo: boolean; onPress: () => void; estilo?: ViewStyle; tamano?: number };

// Selectable pill (gender, goal). Gray with white border; green when selected.
export function Chip({ texto, activo, onPress, estilo, tamano = 16 }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      style={[styles.chip, activo && styles.chipActivo, estilo]}>
      <Text style={[styles.textoChip, { fontSize: tamano }, activo && { color: Colores.verde }]} numberOfLines={1}>
        {texto}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: {
    height: ALTO_BOTON,
    borderRadius: Radios.boton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonGris: { borderWidth: 1, borderColor: '#4A4A4A' },
  presionado: { opacity: 0.85 },
  textoBoton: { fontFamily: Fuentes.etiqueta, fontSize: 19 },

  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginLeft: 4, marginBottom: 5 },
  campo: {
    height: 48,
    borderRadius: 24,
    backgroundColor: Colores.campo,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  campoError: { borderColor: Colores.rojo },
  iconoCampo: { position: 'absolute', left: 21, width: 18, alignItems: 'center' },
  iconoDerecha: { position: 'absolute', right: 18 },
  input: {
    flex: 1,
    height: '100%',
    paddingLeft: 50,
    paddingRight: 48,
    fontFamily: Fuentes.regular,
    fontSize: 15,
    color: Colores.texto,
    outlineStyle: 'solid', // web: hide the browser's focus outline
    outlineWidth: 0,
  },
  textoError: { fontFamily: Fuentes.medium, fontSize: 12, color: Colores.rojo, marginLeft: 4, marginTop: 4 },

  barraFondo: { height: 6, borderRadius: 3, backgroundColor: Colores.campo, overflow: 'hidden' },
  barraLlena: { height: 6, borderRadius: 3, backgroundColor: Colores.verde },

  tarjetaAviso: {
    backgroundColor: '#1C1C1C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: Radios.tarjeta,
    alignItems: 'center',
    paddingHorizontal: 22,
  },

  chip: {
    borderRadius: 20,
    backgroundColor: Colores.chip,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipActivo: { backgroundColor: Colores.verdeSuave, borderColor: Colores.verde },
  textoChip: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
});
