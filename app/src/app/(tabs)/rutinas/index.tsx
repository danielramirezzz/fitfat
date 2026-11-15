import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton, BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { cargarResumen, GRUPOS, TIEMPOS } from '@/lib/rutinas';

const img = {
  hombrosCabeza: require('@/assets/figma/rutinas/icono-hombros-a.svg'),
  hombrosCuerpo: require('@/assets/figma/rutinas/icono-hombros-b.svg'),
  punto1: require('@/assets/figma/rutinas/punto-1.svg'),
  punto2: require('@/assets/figma/rutinas/punto-2.svg'),
  punto3: require('@/assets/figma/rutinas/punto-3.svg'),
  estrella: require('@/assets/figma/rutinas/estrella.svg'),
  rayo: require('@/assets/figma/rutinas/rayo.svg'),
};

type Grupo = (typeof GRUPOS)[number];

// "Pantalla grupo muscular".
export default function GrupoMuscular() {
  const [grupo, setGrupo] = useState<string | null>(null);
  const [minutos, setMinutos] = useState(30);
  const [masEntrenado, setMasEntrenado] = useState<string | null | undefined>(undefined);

  // Social proof: which group people trained most today.
  useFocusEffect(
    useCallback(() => {
      cargarResumen()
        .then((r) => setMasEntrenado(r.masEntrenadoHoy))
        .catch(() => setMasEntrenado(null));
    }, []),
  );

  const generar = () => {
    if (!grupo) return;
    router.push({ pathname: '/rutinas/plan', params: { grupo, minutos: String(minutos) } });
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.navigate('/inicio')} />
        <Text style={styles.titulo}>Rutinas rápidas</Text>
      </View>

      <Text style={styles.pregunta}>¿Qué grupo muscular quieres{'\n'}priorizar hoy?</Text>

      <View style={styles.rejilla}>
        {GRUPOS.map((g) => (
          <TarjetaGrupo key={g.clave} grupo={g} activo={grupo === g.clave} onPress={() => setGrupo(g.clave)} />
        ))}
      </View>

      <View style={styles.social}>
        <View style={styles.puntos}>
          <Image source={img.punto1} style={{ width: 18, height: 18 }} />
          <Image source={img.punto2} style={[styles.punto, { marginLeft: -6 }]} />
          <Image source={img.punto3} style={[styles.punto, { marginLeft: -8 }]} />
        </View>
        <Text style={styles.textoSocial}>
          {masEntrenado === undefined
            ? ' '
            : masEntrenado
              ? `${masEntrenado} es lo más entrenado hoy`
              : 'Sé el primero en entrenar hoy'}
        </Text>
      </View>

      <Text style={styles.etiqueta}>Tiempo disponible</Text>
      <View style={styles.selector} accessibilityRole="radiogroup">
        {TIEMPOS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setMinutos(t)}
            accessibilityRole="radio"
            accessibilityState={{ selected: minutos === t }}
            style={[styles.opcion, minutos === t && styles.opcionActiva]}>
            <Text style={[styles.textoOpcion, minutos === t && { color: '#000' }]}>{t} min</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.premio}>
        <Image source={img.estrella} style={{ width: 20, height: 20 }} />
        <Text style={styles.textoPremio}>Completa la rutina y gana +50 pts</Text>
      </View>

      <View style={styles.botones}>
        <Boton
          texto="Cancelar"
          variante="gris"
          onPress={() => router.push({ pathname: '/rutina-cancelada', params: { origen: 'grupo' } })}
          estilo={{ width: 141 }}
        />
        <Boton
          texto="Generar rutina"
          onPress={generar}
          deshabilitado={!grupo}
          icono={<Image source={img.rayo} style={{ width: 13, height: 20, opacity: grupo ? 1 : 0.4 }} />}
          estilo={{ flex: 1 }}
        />
      </View>
      {!grupo && <Text style={styles.ayuda}>Elige un grupo muscular para generar tu rutina</Text>}
    </Pantalla>
  );
}

function TarjetaGrupo({ grupo, activo, onPress }: { grupo: Grupo; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: activo }}
      accessibilityLabel={`${grupo.nombre}, ${grupo.sub}`}
      style={[styles.tarjeta, activo && styles.tarjetaActiva]}>
      <View style={styles.cuadro}>
        <Image source={grupo.cuadro} style={StyleSheet.absoluteFill} />
        {grupo.icono ? (
          <Image source={grupo.icono} style={{ width: grupo.ancho, height: grupo.alto }} />
        ) : (
          <>
            <Image source={img.hombrosCabeza} style={{ position: 'absolute', left: 17, top: 7, width: 10, height: 10 }} />
            <Image source={img.hombrosCuerpo} style={{ position: 'absolute', left: 8, top: 22, width: 28, height: 14 }} />
          </>
        )}
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.nombreGrupo}>{grupo.nombre}</Text>
        <Text style={styles.subGrupo} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          {grupo.sub}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 14 },
  pregunta: { fontFamily: Fuentes.bold, fontSize: 19, lineHeight: 24, color: Colores.texto, marginTop: 20, marginLeft: 4 },

  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  tarjeta: {
    width: '48.3%',
    flexGrow: 1,
    height: 96,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 6,
  },
  tarjetaActiva: { backgroundColor: 'rgba(30, 255, 60, 0.15)', borderColor: Colores.verde, borderWidth: 2 },
  cuadro: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  nombreGrupo: { fontFamily: Fuentes.bold, fontSize: 16, color: Colores.texto },
  subGrupo: { fontFamily: Fuentes.regular, fontSize: 12, color: '#A8A8A8', marginTop: 4 },

  social: {
    marginTop: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
  },
  puntos: { flexDirection: 'row', alignItems: 'center' },
  punto: { width: 20, height: 20 },
  textoSocial: { fontFamily: Fuentes.regular, fontSize: 13, color: '#D0D0D0', marginLeft: 10 },

  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto, marginTop: 15, marginLeft: 4 },
  selector: {
    marginTop: 8,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colores.campo,
    flexDirection: 'row',
    padding: 4,
  },
  opcion: { flex: 1, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  opcionActiva: { backgroundColor: Colores.verde },
  textoOpcion: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto },

  premio: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginLeft: 4 },
  textoPremio: { fontFamily: Fuentes.bold, fontSize: 14, color: '#FFD000' },

  botones: { flexDirection: 'row', gap: 11, marginTop: 28 },
  ayuda: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoApagado, textAlign: 'center', marginTop: 10 },
});
