import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Text } from '@/components/texto';
import { Boton } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';

const img = {
  fuera: require('@/assets/figma/recuperar/listo-fuera.svg'),
  dentro: require('@/assets/figma/recuperar/listo-dentro.svg'),
  check: require('@/assets/figma/recuperar/listo-check.svg'),
  fueguito: require('@/assets/figma/recuperar/fueguito.svg'),
};

// "Pantalla contraseña actualizada".
export default function ContrasenaActualizada() {
  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.circulos}>
        <Image source={img.fuera} style={StyleSheet.absoluteFill} />
        <Image source={img.dentro} style={{ position: 'absolute', width: 124, height: 124 }} />
        <Image source={img.check} style={{ width: 42.67, height: 31.34 }} />
      </View>

      <Text style={styles.titulo} accessibilityRole="header">
        ¡Contraseña actualizada!
      </Text>
      <Text style={styles.texto}>Ya puedes iniciar sesión con tu nueva contraseña. Tu racha te está esperando.</Text>

      <Image source={img.fueguito} style={styles.fueguito} accessibilityLabel="Fueguito feliz" />

      <Boton texto="Iniciar sesión" onPress={() => router.replace('/login')} estilo={{ marginTop: 'auto' }} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { flexGrow: 1, paddingTop: 130, paddingBottom: 110 },
  circulos: { alignSelf: 'center', width: 192, height: 192, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, textAlign: 'center', marginTop: 40 },
  texto: {
    fontFamily: Fuentes.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Colores.textoClaro,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
  },
  fueguito: { alignSelf: 'center', width: 61.2, height: 88.2, marginTop: 50 },
});
