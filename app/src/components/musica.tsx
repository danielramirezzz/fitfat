import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { avisar } from '@/lib/avisos';

// Music services. The https links are "universal links": if the app is
// installed, the phone opens it directly; if not, the web version opens.
const SERVICIOS = [
  {
    nombre: 'Spotify',
    logo: require('@/assets/musica/spotify.svg'),
    url: 'https://open.spotify.com/search/workout%20motivation',
  },
  {
    nombre: 'Apple Music',
    logo: require('@/assets/musica/apple-music.svg'),
    url: 'https://music.apple.com/search?term=workout',
  },
  {
    nombre: 'YouTube Music',
    logo: require('@/assets/musica/youtube-music.svg'),
    url: 'https://music.youtube.com/search?q=workout%20motivation',
  },
] as const;

async function abrir(nombre: string, url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    avisar('No se pudo abrir', `No pudimos abrir ${nombre}. Revisa que tengas conexión a internet.`);
  }
}

// "Música para entrenar": card with the three services (Rutinas y videos).
// `compacto` = a single row of round logos (used during the workout).
export function Musica({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <View style={styles.filaCompacta}>
        <Text style={styles.etiquetaCompacta}>🎧 Música</Text>
        {SERVICIOS.map((s) => (
          <Pressable
            key={s.nombre}
            onPress={() => abrir(s.nombre, s.url)}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${s.nombre}`}
            hitSlop={6}
            style={styles.logoCompacto}>
            <Image source={s.logo} style={{ width: 22, height: 22 }} contentFit="contain" />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.tarjeta}>
      <Text style={styles.titulo}>🎧 Música para entrenar</Text>
      <Text style={styles.sub}>Abre tu app favorita, dale play y vuelve a FitFat.</Text>
      <View style={styles.fila}>
        {SERVICIOS.map((s) => (
          <Pressable
            key={s.nombre}
            onPress={() => abrir(s.nombre, s.url)}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${s.nombre}`}
            style={({ pressed }) => [styles.servicio, pressed && { opacity: 0.7 }]}>
            <Image source={s.logo} style={{ width: 32, height: 32 }} contentFit="contain" />
            <Text style={styles.nombre} numberOfLines={1} adjustsFontSizeToFit>
              {s.nombre}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    marginTop: 18,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    padding: 16,
  },
  titulo: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
  sub: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 4 },
  fila: { flexDirection: 'row', gap: 10, marginTop: 12 },
  servicio: {
    flex: 1,
    height: 74,
    borderRadius: 14,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  nombre: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.texto },

  filaCompacta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 14 },
  etiquetaCompacta: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.textoSecundario },
  logoCompacto: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
