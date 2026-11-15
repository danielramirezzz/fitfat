import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Colores, Fuentes, Radios } from '@/constants/theme';

// Temporary placeholder for each tab until we build its real screen.
export function EnConstruccion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <Pantalla>
      <Text style={styles.titulo}>{titulo}</Text>
      <View style={styles.tarjeta}>
        <Image source={require('@/assets/images/fueguito.png')} style={styles.fueguito} contentFit="contain" />
        <Text style={styles.chip}>PRÓXIMAMENTE</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: Fuentes.extraBold, fontSize: 30, color: Colores.texto, marginBottom: 20 },
  tarjeta: {
    backgroundColor: Colores.tarjeta,
    borderRadius: Radios.tarjeta,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  fueguito: { width: 72, height: 72 },
  chip: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.verde },
  descripcion: {
    fontFamily: Fuentes.regular,
    fontSize: 14,
    color: Colores.textoSecundario,
    textAlign: 'center',
  },
});
