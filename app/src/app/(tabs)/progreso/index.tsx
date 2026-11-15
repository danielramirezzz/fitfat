import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton, BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { cambioFavorable, cargarSemana, DatosSemana, formatoKg, miles } from '@/lib/progreso';

const img = {
  anterior: require('@/assets/figma/progreso/btn-anterior.svg'),
  siguiente: require('@/assets/figma/progreso/btn-siguiente.svg'),
  barraCero: require('@/assets/figma/progreso/barra-cero.svg'),
  fueguito: require('@/assets/figma/progreso/fueguito-banner.svg'),
  estrellaCirculo: require('@/assets/figma/progreso/estrella-circulo.svg'),
  estrella: require('@/assets/figma/progreso/estrella.svg'),
};

const ALTO_GRAFICA = 120; // px of the tallest bar

// "Pantalla progreso semanal".
export default function ProgresoSemanal() {
  const [offset, setOffset] = useState(0); // 0 = this week, -1 = last week...
  const [datos, setDatos] = useState<DatosSemana | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback((o: number) => {
    setError('');
    cargarSemana(o)
      .then(setDatos)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar.'));
  }, []);

  useFocusEffect(useCallback(() => cargar(offset), [cargar, offset]));

  const cambiarSemana = (o: number) => {
    setOffset(o);
    cargar(o);
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.navigate('/inicio')} />
        <Text style={styles.titulo}>Progreso semanal</Text>
      </View>

      {!datos ? (
        <View style={styles.cargando}>
          {error ? <Text style={styles.gris}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      ) : (
        <Contenido datos={datos} offset={offset} onCambiarSemana={cambiarSemana} />
      )}
    </Pantalla>
  );
}

function Contenido({ datos: d, offset, onCambiarSemana }: { datos: DatosSemana; offset: number; onCambiarSemana: (o: number) => void }) {
  const maximo = Math.max(45, ...d.dias.map((x) => x.minutos));
  const falta = d.metaMinutos - d.minutos;
  const { nivel, puntos, siguiente } = d.nivel;
  const avanceNivel = (puntos - (nivel - 1) * 500) / 500;

  // Persuasive message: how far the weekly goal is.
  let titulo: string;
  let texto: string;
  if (d.actual) {
    if (falta <= 0) {
      titulo = '¡Meta semanal cumplida!';
      texto = `Llevas ${d.minutos} minutos esta semana. ¡Sigue así!`;
    } else if (falta <= 45) {
      titulo = `¡Te faltan solo ${falta} minutos!`;
      texto = 'Una rutina rápida y cumples tu meta.';
    } else {
      titulo = `¡Te faltan ${falta} minutos!`;
      texto = 'Entrena hoy y acércate a tu meta semanal.';
    }
  } else if (falta <= 0) {
    titulo = '¡Cumpliste tu meta esa semana!';
    texto = `Hiciste ${d.minutos} minutos de entrenamiento.`;
  } else {
    titulo = `Esa semana hiciste ${d.minutos} de ${d.metaMinutos} min`;
    texto = 'Esta semana puedes superarlo.';
  }

  const cambio = d.cambioPeso;

  return (
    <>
      {/* Week selector */}
      <View style={styles.selector}>
        <Pressable onPress={() => onCambiarSemana(offset - 1)} accessibilityRole="button" accessibilityLabel="Semana anterior">
          <Image source={img.anterior} style={{ width: 40, height: 40 }} />
        </Pressable>
        <Text style={styles.rango}>{d.rango}</Text>
        <Pressable
          onPress={() => onCambiarSemana(offset + 1)}
          disabled={d.actual}
          accessibilityRole="button"
          accessibilityLabel="Semana siguiente"
          style={{ opacity: d.actual ? 0.3 : 1 }}>
          <Image source={img.siguiente} style={{ width: 40, height: 40 }} />
        </Pressable>
      </View>

      <View style={styles.datos}>
        <Dato etiqueta="Entrenos" valor={`${d.entrenos}/${d.metaEntrenos}`} />
        <Dato etiqueta="Minutos" valor={String(d.minutos)} />
        <Dato
          etiqueta="Peso"
          valor={cambio === null ? '—' : formatoKg(cambio)}
          color={cambio !== null && cambio !== 0 && cambioFavorable(cambio, d.objetivo) ? Colores.verde : Colores.texto}
        />
      </View>

      {/* Bar chart: minutes per day */}
      <View style={styles.grafica}>
        <View style={styles.filaTitulo}>
          <Text style={styles.tituloGrafica}>Minutos de entrenamiento</Text>
          <Text style={styles.meta}>Meta: {d.metaMinutos} min</Text>
        </View>
        <View style={styles.barras}>
          {d.dias.map((dia) => (
            <View key={dia.fecha} style={styles.columna} accessible accessibilityLabel={`${dia.letra}: ${dia.minutos} minutos`}>
              {!dia.futuro && (
                <>
                  <Text style={[styles.valorBarra, dia.minutos === 0 && { color: '#777' }]}>{dia.minutos}</Text>
                  {dia.minutos > 0 ? (
                    <View style={[styles.barra, { height: Math.max(8, (dia.minutos / maximo) * ALTO_GRAFICA) }]} />
                  ) : (
                    <Image source={img.barraCero} style={{ width: 22, height: 3 }} />
                  )}
                </>
              )}
            </View>
          ))}
        </View>
        <View style={styles.letras}>
          {d.dias.map((dia) => (
            <Text key={dia.fecha} style={[styles.letra, dia.hoy && { color: Colores.verde }]}>
              {dia.letra}
            </Text>
          ))}
        </View>
      </View>

      <Pressable
        onPress={d.actual && falta > 0 ? () => router.navigate('/rutinas') : undefined}
        disabled={!(d.actual && falta > 0)}
        style={styles.banner}>
        <Image source={img.fueguito} style={{ width: 33.6, height: 51.6 }} />
        <View style={{ flex: 1, marginLeft: 18 }}>
          <Text style={styles.tituloBanner}>{titulo}</Text>
          <Text style={styles.textoBanner}>{texto}</Text>
        </View>
      </Pressable>

      <View style={styles.nivel}>
        <View style={styles.estrella}>
          <Image source={img.estrellaCirculo} style={StyleSheet.absoluteFill} />
          <Image source={img.estrella} style={{ width: 20, height: 19 }} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.textoNivel}>
            Nivel {nivel} · {miles(puntos)} puntos
          </Text>
          <View style={styles.filaNivel}>
            <View style={styles.barraNivel}>
              <View style={[styles.barraNivelLlena, { width: `${avanceNivel * 100}%` }]} />
            </View>
            <Text style={styles.siguienteNivel}>Nivel {nivel + 1}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.faltanPuntos}>Te faltan {miles(siguiente - puntos)} puntos para subir de nivel</Text>

      <Boton texto="Ver estadísticas completas" onPress={() => router.push('/progreso/estadisticas')} estilo={{ marginTop: 14 }} />
    </>
  );
}

function Dato({ etiqueta, valor, color = Colores.texto }: { etiqueta: string; valor: string; color?: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.etiquetaDato}>{etiqueta}</Text>
      <Text style={[styles.valorDato, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cargando: { height: 300, alignItems: 'center', justifyContent: 'center' },
  gris: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 14 },

  selector: {
    marginTop: 18,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  rango: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto },

  datos: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dato: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    paddingHorizontal: 11,
    paddingTop: 10,
  },
  etiquetaDato: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  valorDato: { fontFamily: Fuentes.bold, fontSize: 22, marginTop: 6 },

  grafica: {
    marginTop: 16,
    height: 266,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  filaTitulo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tituloGrafica: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
  meta: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  barras: { flexDirection: 'row', height: 170, alignItems: 'flex-end', marginTop: 12 },
  columna: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  valorBarra: { fontFamily: Fuentes.regular, fontSize: 12, color: '#DDDDDD', marginBottom: 6 },
  barra: { width: 22, borderRadius: 6, backgroundColor: Colores.verde },
  letras: { flexDirection: 'row', marginTop: 12 },
  letra: { flex: 1, textAlign: 'center', fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.textoSecundario },

  banner: {
    marginTop: 14,
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: '#2A1400',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tituloBanner: { fontFamily: Fuentes.bold, fontSize: 15, color: '#FF8A00' },
  textoBanner: { fontFamily: Fuentes.regular, fontSize: 13, color: '#E6E6E6', marginTop: 6 },

  nivel: {
    marginTop: 14,
    height: 59,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  estrella: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  textoNivel: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.texto },
  filaNivel: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 12 },
  barraNivel: { flex: 1, height: 7, borderRadius: 4, backgroundColor: '#2C2C2C', overflow: 'hidden' },
  barraNivelLlena: { height: 7, borderRadius: 4, backgroundColor: '#FFC400' },
  siguienteNivel: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.textoSecundario },
  faltanPuntos: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoApagado, textAlign: 'center', marginTop: 8 },
});
