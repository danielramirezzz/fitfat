import { Image } from 'expo-image';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Colores, Fuentes } from '@/constants/theme';

const img = {
  activo: require('@/assets/figma/recuperar/paso-activo.svg'),
  inactivo: require('@/assets/figma/recuperar/paso-inactivo.svg'),
};

// The 3 little bars under the title (step 1, 2 or 3 of the recovery).
export function PasosRecuperar({ paso }: { paso: 1 | 2 | 3 }) {
  return (
    <View style={styles.pasos} accessible accessibilityLabel={`Paso ${paso} de 3`}>
      {[1, 2, 3].map((n) => (
        <Image key={n} source={n <= paso ? img.activo : img.inactivo} style={{ width: 30, height: 6 }} />
      ))}
    </View>
  );
}

// Dark-green circle with the icon + title + gray explanation.
export function EncabezadoRecuperar({
  circulo,
  icono,
  titulo,
  children,
}: {
  circulo: ReactNode;
  icono: ReactNode;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <>
      <View style={styles.circulo}>
        {circulo}
        {icono}
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      {children}
    </>
  );
}

export const estilosRecuperar = StyleSheet.create({
  explicacion: {
    fontFamily: Fuentes.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colores.textoClaro,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 30,
  },
  enlace: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  enlaceGris: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoClaro },
  enlaceVerde: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.verde },
});

const styles = StyleSheet.create({
  pasos: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
  circulo: { alignSelf: 'center', width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginTop: 42 },
  titulo: { fontFamily: Fuentes.bold, fontSize: 22, color: Colores.texto, textAlign: 'center', marginTop: 20 },
});
