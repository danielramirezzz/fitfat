import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Musica } from '@/components/musica';
import { VideoEjercicio } from '@/components/video-ejercicio';
import { Pantalla } from '@/components/pantalla';
import { Boton, BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { cantidad, cargarRutina, guardarRutinaActual, reloj, Rutina } from '@/lib/rutinas';

const img = {
  pildora: require('@/assets/figma/rutinas/pildora-tiempo.svg'),
  cuadroPlay: require('@/assets/figma/rutinas/cuadro-play.svg'),
  playChico: require('@/assets/figma/rutinas/play-chico.svg'),
  cuadroNumero: require('@/assets/figma/rutinas/cuadro-numero.svg'),
  playBoton: require('@/assets/figma/rutinas/play-boton.svg'),
};

// "Pantalla rutinas y videos": the plan of the routine before starting.
export default function PlanRutina() {
  const { grupo, minutos } = useLocalSearchParams<{ grupo: string; minutos: string }>();
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [error, setError] = useState('');
  const [elegido, setElegido] = useState(0); // exercise previewed in the video card

  useEffect(() => {
    cargarRutina(grupo ?? 'piernas', Number(minutos ?? 30))
      .then(setRutina)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar la rutina.'));
  }, [grupo, minutos]);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/rutinas'));

  if (!rutina) {
    return (
      <Pantalla estiloContenido={styles.contenido}>
        <BotonVolver onPress={volver} />
        <View style={styles.cargando}>
          {error ? <Text style={styles.sub}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      </Pantalla>
    );
  }

  const total = rutina.ejercicios.length;
  const ej = rutina.ejercicios[elegido];

  const empezar = () => {
    guardarRutinaActual(rutina);
    router.push('/entreno');
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={volver} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.titulo}>{rutina.titulo}</Text>
          <Text style={styles.sub}>
            {rutina.minutos} min · {total} ejercicios · {rutina.nivel}
          </Text>
        </View>
      </View>

      {/* Video card: the technique video of the chosen exercise plays right here */}
      <View style={styles.video} accessible accessibilityLabel={`Video de ${ej.nombre}`}>
        <VideoEjercicio key={ej.video} clave={ej.video} estilo={StyleSheet.absoluteFill} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.sombra} pointerEvents="none" />
        <View style={styles.pildora}>
          <Image source={img.pildora} style={StyleSheet.absoluteFill} />
          <Text style={styles.textoPildora}>{reloj(ej.duracionSerie).replace(/^0/, '')}</Text>
        </View>
        <Text style={styles.numeroEj}>
          EJERCICIO {elegido + 1} DE {total}
        </Text>
        <Text style={styles.nombreEj} numberOfLines={1}>
          {ej.nombre}
        </Text>
      </View>

      <View style={styles.filaProgreso}>
        <Text style={styles.etiqueta}>Progreso de la rutina</Text>
        <Text style={[styles.etiqueta, { color: Colores.verde }]}>0 de {total}</Text>
      </View>
      <View style={styles.barra} />

      <View style={{ gap: 7, marginTop: 18 }}>
        {rutina.ejercicios.map((e, i) => {
          const activo = i === elegido;
          return (
            <Pressable
              key={e.nombre}
              onPress={() => setElegido(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: activo }}
              style={[styles.item, activo && styles.itemActivo]}>
              <View style={styles.cuadro}>
                <Image source={activo ? img.cuadroPlay : img.cuadroNumero} style={StyleSheet.absoluteFill} />
                {activo ? (
                  <Image source={img.playChico} style={{ width: 14, height: 18, marginLeft: 3 }} />
                ) : (
                  <Text style={styles.numero}>{i + 1}</Text>
                )}
              </View>
              <Text style={styles.nombreItem} numberOfLines={1}>
                {e.nombre}
              </Text>
              <Text style={[styles.cantidad, activo && { color: Colores.verde }]}>{cantidad(e)}</Text>
            </Pressable>
          );
        })}
      </View>

      <Musica />

      <Boton
        texto="Empezar rutina"
        onPress={empezar}
        icono={<Image source={img.playBoton} style={{ width: 11, height: 14 }} />}
        estilo={{ marginTop: 22 }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cargando: { height: 300, alignItems: 'center', justifyContent: 'center' },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 22, color: Colores.texto },
  sub: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 4 },

  video: { marginTop: 20, height: 196, borderRadius: 18, overflow: 'hidden', backgroundColor: '#111' },
  sombra: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  pildora: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 48,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoPildora: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.texto },
  numeroEj: { position: 'absolute', left: 16, top: 146, fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde },
  nombreEj: { position: 'absolute', left: 16, right: 16, top: 165, fontFamily: Fuentes.bold, fontSize: 17, color: Colores.texto },

  filaProgreso: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingHorizontal: 4 },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
  barra: { height: 10, borderRadius: 5, backgroundColor: '#2C2C2C', marginTop: 6 },

  item: {
    height: 57,
    borderRadius: 16.5,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 16,
  },
  itemActivo: { borderColor: Colores.verde, borderWidth: 1.5 },
  cuadro: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  numero: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  nombreItem: { flex: 1, fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginLeft: 14 },
  cantidad: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.textoClaro, marginLeft: 8 },
});
