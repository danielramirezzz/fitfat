import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { obtenerResultadoRegistro } from '@/lib/comida';

const img = {
  destello1: require('@/assets/figma/comida/destello-1.svg'),
  destello2: require('@/assets/figma/comida/destello-2.svg'),
  destello3: require('@/assets/figma/comida/destello-3.svg'),
  puntoNaranja: require('@/assets/figma/comida/punto-naranja.svg'),
  puntoRosa: require('@/assets/figma/comida/punto-rosa.svg'),
  fueguito: require('@/assets/figma/comida/fueguito-feliz.svg'),
  checkCirculo: require('@/assets/figma/comida/check-grande-circulo.svg'),
  check: require('@/assets/figma/comida/check-grande.svg'),
};

const dias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

// "Pantalla confirmación registro de alimentos".
export default function ComidaGuardada() {
  const r = obtenerResultadoRegistro();
  if (!r) return <Redirect href="/comida" />;

  const { antes, ahora } = r.racha;
  const mensaje = ahora > antes ? `¡Tu racha sube a ${dias(ahora)}!` : `¡Tu racha sigue en ${dias(ahora)}!`;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      {/* Happy fueguito with sparkles (positions from Figma, relative to a 402px frame) */}
      <View style={styles.celebracion}>
        <Image source={img.puntoRosa} style={[styles.abs, { left: 287, top: 20, width: 6, height: 6 }]} />
        <Image source={img.destello2} style={[styles.abs, { left: 302, top: 53, width: 20, height: 20 }]} />
        <Image source={img.destello1} style={[styles.abs, { left: 82, top: 73, width: 28, height: 28 }]} />
        <Image source={img.puntoNaranja} style={[styles.abs, { left: 80, top: 169, width: 8, height: 8 }]} />
        <Image source={img.destello3} style={[styles.abs, { left: 308, top: 167, width: 20, height: 20 }]} />
        <Image source={img.fueguito} style={[styles.abs, { left: 165, top: 50, width: 72.8, height: 111.8 }]} />
      </View>

      <View style={styles.zona}>
        <TarjetaAviso estilo={styles.tarjeta}>
          <Text style={styles.titulo}>¡Registro guardado!</Text>
          <Text style={styles.mensaje}>Con tus registros armamos{'\n'}tu plan de alimentación.</Text>
          <View style={styles.caja}>
            <Text style={styles.racha}>{mensaje}</Text>
            <View style={styles.pildora}>
              <Text style={styles.puntos}>
                {r.puntosGanados > 0 ? `+${r.puntosGanados} puntos` : 'Comida actualizada'}
              </Text>
            </View>
          </View>
          <Boton texto="Ver mi plan de alimentación" onPress={() => router.replace('/comida/plan')} estilo={styles.boton} />
          <Boton texto="Ir al inicio" variante="gris" onPress={() => router.replace('/inicio')} estilo={styles.botonSecundario} />
        </TarjetaAviso>
        {/* Green check overlapping the top edge of the card */}
        <View style={styles.check}>
          <Image source={img.checkCirculo} style={StyleSheet.absoluteFill} />
          <Image source={img.check} style={{ width: 23, height: 17 }} />
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 0, paddingHorizontal: 36 },
  // 402px-wide drawing area centered on any screen width.
  celebracion: { height: 200, width: 402, alignSelf: 'center' },
  abs: { position: 'absolute' },
  zona: { marginTop: 18 },
  tarjeta: { paddingTop: 36, paddingBottom: 22 },
  check: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: Fuentes.bold, fontSize: 25, color: Colores.texto, textAlign: 'center' },
  mensaje: { fontFamily: Fuentes.regular, fontSize: 15, lineHeight: 21, color: '#D0D0D0', textAlign: 'center', marginTop: 10 },
  caja: {
    alignSelf: 'stretch',
    marginTop: 14,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#2A1400',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  racha: { fontFamily: Fuentes.bold, fontSize: 17, color: '#FF8A00' },
  pildora: { height: 20, minWidth: 120, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#0F2E14', justifyContent: 'center' },
  puntos: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde, textAlign: 'center' },
  boton: { alignSelf: 'stretch', marginTop: 18 },
  botonSecundario: { alignSelf: 'stretch', marginTop: 12 },
});
