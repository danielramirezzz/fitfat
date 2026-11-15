import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton, TarjetaAviso } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { obtenerResultadoAlertas } from '@/lib/alertas';

// Same sparkles, fueguito and check as "Registro guardado" (identical Figma assets).
const img = {
  destello1: require('@/assets/figma/comida/destello-1.svg'),
  destello2: require('@/assets/figma/comida/destello-2.svg'),
  destello3: require('@/assets/figma/comida/destello-3.svg'),
  puntoNaranja: require('@/assets/figma/comida/punto-naranja.svg'),
  fueguito: require('@/assets/figma/comida/fueguito-feliz.svg'),
  checkCirculo: require('@/assets/figma/comida/check-grande-circulo.svg'),
  check: require('@/assets/figma/comida/check-grande.svg'),
};

// "Pantalla configuración guardada".
export default function AlertaGuardada() {
  const puntos = obtenerResultadoAlertas()?.puntosGanados ?? 0;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.celebracion}>
        <Image source={img.destello2} style={[styles.abs, { left: 302, top: 53, width: 20, height: 20 }]} />
        <Image source={img.destello1} style={[styles.abs, { left: 82, top: 73, width: 28, height: 28 }]} />
        <Image source={img.puntoNaranja} style={[styles.abs, { left: 80, top: 169, width: 8, height: 8 }]} />
        <Image source={img.destello3} style={[styles.abs, { left: 308, top: 167, width: 20, height: 20 }]} />
        <Image source={img.fueguito} style={[styles.abs, { left: 165, top: 50, width: 72.8, height: 111.8 }]} />
      </View>

      <View style={{ marginTop: 18 }}>
        <TarjetaAviso estilo={styles.tarjeta}>
          <Text style={styles.titulo}>Configuración guardada</Text>
          <Text style={styles.mensaje}>Te avisaremos por los canales y{'\n'}alertas que elegiste.</Text>
          {puntos > 0 && (
            <View style={styles.pildora}>
              <Text style={styles.puntos}>+{puntos} puntos</Text>
            </View>
          )}
          <Boton texto="¡Listo!" onPress={() => router.replace('/alertas')} estilo={styles.boton} />
        </TarjetaAviso>
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
  celebracion: { height: 200, width: 402, alignSelf: 'center' },
  abs: { position: 'absolute' },
  tarjeta: { paddingTop: 36, paddingBottom: 26 },
  check: { position: 'absolute', top: -22, alignSelf: 'center', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, textAlign: 'center' },
  mensaje: { fontFamily: Fuentes.regular, fontSize: 15, lineHeight: 21, color: '#D0D0D0', textAlign: 'center', marginTop: 10 },
  pildora: { marginTop: 16, height: 32, paddingHorizontal: 22, borderRadius: 16, backgroundColor: '#0F2E14', justifyContent: 'center' },
  puntos: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.verde },
  boton: { alignSelf: 'stretch', marginTop: 24 },
});
