import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { obtenerResultado } from '@/lib/rutinas';

const img = {
  confeti: require('@/assets/figma/rutinas/confeti.svg'),
  circulo: require('@/assets/figma/rutinas/circulo-fueguito.svg'),
  fueguito: require('@/assets/figma/rutinas/fueguito-feliz.svg'),
  reloj: require('@/assets/figma/rutinas/reloj.svg'),
  pesa: require('@/assets/figma/rutinas/pesa-dato.svg'),
  rayo: require('@/assets/figma/rutinas/rayo-dato.svg'),
  fueguitoRacha: require('@/assets/figma/rutinas/fueguito-racha.svg'),
};

// 1290 → "1.290" (Colombian thousands separator).
const miles = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// "Pantalla rutina completada": reward screen (points, streak, level).
export default function RutinaCompletada() {
  const r = obtenerResultado();
  if (!r) return <Redirect href="/inicio" />;

  const { dias, record, recordAnterior } = r.racha;
  const { nivel, puntos, siguiente } = r.nivel;
  const avanceNivel = (puntos - (nivel - 1) * 500) / 500;

  const mensajeRacha = record
    ? 'Superaste tu récord personal'
    : dias === 1
      ? 'Encendiste tu fueguito. ¡Vuelve mañana!'
      : dias === recordAnterior
        ? '¡Igualaste tu récord personal!'
        : `Tu récord es de ${recordAnterior} días. ¡Ve por él!`;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.celebracion}>
        <Image source={img.confeti} style={styles.confeti} contentFit="contain" />
        <View style={styles.circulo}>
          <Image source={img.circulo} style={StyleSheet.absoluteFill} />
          <Image source={img.fueguito} style={{ width: 102, height: 147, marginTop: 10 }} />
        </View>
      </View>

      <Text style={styles.titulo}>¡Rutina completada!</Text>
      <Text style={styles.sub}>Tu fueguito está más fuerte que nunca</Text>

      <View style={styles.datos}>
        <Dato icono={img.reloj} ancho={20} alto={20} valor={`${r.minutos} min`} etiqueta="Tiempo" />
        <Dato icono={img.pesa} ancho={20} alto={12} valor={`${r.ejercicios}/${r.ejercicios}`} etiqueta="Ejercicios" />
        <Dato icono={img.rayo} ancho={17} alto={22} valor={String(r.calorias)} etiqueta="Calorías" />
      </View>

      <View style={styles.racha}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={img.fueguitoRacha} style={{ width: 24.5, height: 35.3, marginLeft: 14 }} />
          <View style={{ marginLeft: 18, flex: 1 }}>
            <Text style={styles.tituloRacha}>
              ¡Racha de {dias} {dias === 1 ? 'día' : 'días'}!
            </Text>
            <Text style={styles.subRacha}>{mensajeRacha}</Text>
          </View>
        </View>
        <View style={styles.barra}>
          <View style={[styles.barraLlena, { width: `${avanceNivel * 100}%` }]} />
        </View>
        <View style={styles.filaNivel}>
          <Text style={styles.nivel}>Nivel {nivel}</Text>
          <Text style={styles.puntos}>
            +{r.puntosGanados} pts · {miles(puntos)} / {miles(siguiente)}
          </Text>
        </View>
      </View>

      <Boton texto="Ver mi progreso" onPress={() => router.replace('/progreso')} estilo={{ marginTop: 40 }} />
      <Boton texto="Ir al inicio" variante="gris" onPress={() => router.replace('/inicio')} estilo={{ marginTop: 12 }} />
    </Pantalla>
  );
}

function Dato({ icono, ancho, alto, valor, etiqueta }: { icono: number; ancho: number; alto: number; valor: string; etiqueta: string }) {
  return (
    <View style={styles.dato}>
      <View style={{ height: 22, justifyContent: 'center' }}>
        <Image source={icono} style={{ width: ancho, height: alto }} />
      </View>
      <Text style={styles.valor}>{valor}</Text>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 12 },
  celebracion: { height: 230, alignItems: 'center' },
  confeti: { position: 'absolute', top: 0, width: '100%', height: 269 },
  circulo: { marginTop: 32, width: 180, height: 180, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 28, color: Colores.texto, textAlign: 'center', marginTop: 18 },
  sub: { fontFamily: Fuentes.regular, fontSize: 15, color: Colores.textoClaro, textAlign: 'center', marginTop: 8 },

  datos: { flexDirection: 'row', gap: 6, marginTop: 22 },
  dato: {
    flex: 1,
    height: 87,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    alignItems: 'center',
    paddingTop: 14,
  },
  valor: { fontFamily: Fuentes.bold, fontSize: 20, color: Colores.texto, marginTop: 4 },
  etiqueta: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 2 },

  racha: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: '#1A2A12',
    borderWidth: 1,
    borderColor: Colores.verde,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  tituloRacha: { fontFamily: Fuentes.bold, fontSize: 18, color: Colores.texto },
  subRacha: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoClaro, marginTop: 4 },
  barra: { height: 10, borderRadius: 5, backgroundColor: '#2C2C2C', marginTop: 16, overflow: 'hidden' },
  barraLlena: { height: 10, borderRadius: 5, backgroundColor: Colores.verde },
  filaNivel: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  nivel: { fontFamily: Fuentes.bold, fontSize: 12, color: Colores.textoSecundario },
  puntos: { fontFamily: Fuentes.bold, fontSize: 12, color: Colores.verde },
});
