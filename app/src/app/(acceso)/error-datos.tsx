import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { IconoErrorNube, IconoReintentar } from '@/components/iconos-acceso';
import { Pantalla } from '@/components/pantalla';
import { Boton } from '@/components/ui';
import { Colores, Fuentes, Radios } from '@/constants/theme';

// "Pantalla error de datos": shown when the user or password are wrong.
export default function ErrorDatos() {
  const { mensaje } = useLocalSearchParams<{ mensaje?: string }>();
  const reintentar = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  return (
    <Pantalla zigzag estiloContenido={styles.contenido}>
      <Image source={require('@/assets/figma/acceso/simbolo.png')} style={styles.simbolo} contentFit="cover" />

      <View style={styles.tarjeta}>
        <IconoErrorNube />
        <Text style={styles.titulo}>Error al iniciar sesión</Text>
        <Text style={styles.mensaje}>
          {mensaje || 'Escribe tu usuario (o correo) y tu contraseña.'}
        </Text>
        <Boton texto="Reintentar" onPress={reintentar} icono={<IconoReintentar />} estilo={styles.boton} />
        <Pressable onPress={() => router.push('/recuperar')} hitSlop={6}>
          <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>
        </Pressable>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 0, paddingBottom: 130, paddingHorizontal: 36 },
  simbolo: { width: 96, height: 96, alignSelf: 'center' },
  tarjeta: {
    marginTop: 112,
    backgroundColor: '#1C1C1C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: Radios.tarjeta,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 18,
    paddingHorizontal: 22,
  },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginTop: 14, textAlign: 'center' },
  mensaje: {
    fontFamily: Fuentes.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#D0D0D0',
    textAlign: 'center',
    marginTop: 10,
  },
  boton: { alignSelf: 'stretch', marginTop: 22, marginBottom: 16 },
  olvidaste: { fontFamily: Fuentes.bold, fontSize: 13, color: Colores.textoApagado },
});
