import { Image } from 'expo-image';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Colores, Fuentes } from '@/constants/theme';
import { cargarNotificaciones, marcarLeidas, Notificacion } from '@/lib/alertas';

const img = {
  atras: require('@/assets/figma/alertas/boton-atras.svg'),
  noLeida: require('@/assets/figma/alertas/punto-no-leida.svg'),
  circuloRacha: require('@/assets/figma/alertas/circulo-racha.svg'),
  fueguito: require('@/assets/figma/alertas/fueguito.svg'),
  circuloAgua: require('@/assets/figma/alertas/circulo-agua.svg'),
  gota: require('@/assets/figma/alertas/gota.svg'),
  circuloLogro: require('@/assets/figma/alertas/circulo-logro.svg'),
  trofeo: require('@/assets/figma/alertas/trofeo.svg'),
  circuloRutina: require('@/assets/figma/alertas/circulo-rutina.svg'),
  pesa: require('@/assets/figma/alertas/pesa.svg'),
  circuloResumen: require('@/assets/figma/alertas/circulo-resumen.svg'),
  grafica: require('@/assets/figma/alertas/grafica.svg'),
};

// Icon of each notification type (pieces and offsets from Figma).
const ICONOS: Record<string, { circulo: number; icono: number; w: number; h: number; x: number; y: number }> = {
  racha: { circulo: img.circuloRacha, icono: img.fueguito, w: 20.4, h: 29.4, x: 11.8, y: 8 },
  agua: { circulo: img.circuloAgua, icono: img.gota, w: 14.3, h: 19.3, x: 14.8, y: 11.7 },
  logro: { circulo: img.circuloLogro, icono: img.trofeo, w: 18.3, h: 19.3, x: 12.8, y: 12.8 },
  rutina: { circulo: img.circuloRutina, icono: img.pesa, w: 20.35, h: 12.28, x: 11.8, y: 15.8 },
  resumen: { circulo: img.circuloResumen, icono: img.grafica, w: 20.35, h: 17.3, x: 11.8, y: 13.9 },
};
// Types without their own Figma icon reuse the closest one.
const ICONO_DE: Record<string, string> = { comida: 'racha', dormir: 'resumen', pesaje: 'resumen' };

// Where tapping a notification takes the user.
const DESTINO: Record<string, Href> = {
  racha: '/rutinas',
  rutina: '/rutinas',
  agua: '/comida',
  comida: '/comida',
  dormir: '/comida',
  pesaje: '/progreso/estadisticas',
  resumen: '/progreso',
  logro: '/progreso/estadisticas',
};

// "Hace 1 h", "Ayer", "Hace 3 días"
function hace(iso: string) {
  const minutos = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}

// Groups: today / this week (last 7 days) / older.
function grupo(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  return Date.now() - d.getTime() < 7 * 86400000 ? 'Esta semana' : 'Anteriores';
}

// "Pantalla notificaciones".
export default function Notificaciones() {
  const [lista, setLista] = useState<Notificacion[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      cargarNotificaciones()
        .then((r) => setLista(r.notificaciones))
        .catch(() => setLista([]));
    }, []),
  );

  const leerTodas = async () => {
    await marcarLeidas().catch(() => {});
    setLista((l) => l?.map((n) => ({ ...n, leida: true })) ?? l);
  };

  const grupos = ['Hoy', 'Esta semana', 'Anteriores']
    .map((g) => ({ nombre: g, items: (lista ?? []).filter((n) => grupo(n.creadaEn) === g) }))
    .filter((g) => g.items.length > 0);

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/inicio'))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}>
          <Image source={img.atras} style={{ width: 44, height: 44 }} />
        </Pressable>
        <Text style={styles.titulo}>Notificaciones</Text>
        <Pressable onPress={leerTodas} hitSlop={8} accessibilityRole="button">
          <Text style={styles.marcar}>Marcar leídas</Text>
        </Pressable>
      </View>

      {!lista ? (
        <ActivityIndicator color={Colores.verde} style={{ marginTop: 80 }} />
      ) : (
        <>
          {grupos.map((g) => (
            <View key={g.nombre}>
              <Text style={styles.grupo}>{g.nombre}</Text>
              <View style={{ gap: 11 }}>
                {g.items.map((n) => (
                  <Tarjeta key={n.id} n={n} />
                ))}
              </View>
            </View>
          ))}
          <Text style={styles.alDia}>{lista.length === 0 ? 'Aún no tienes notificaciones' : 'Estás al día ✓'}</Text>
        </>
      )}
    </Pantalla>
  );
}

function Tarjeta({ n }: { n: Notificacion }) {
  const i = ICONOS[n.tipo] ?? ICONOS[ICONO_DE[n.tipo] ?? 'resumen'];
  return (
    <Pressable
      onPress={() => router.navigate(DESTINO[n.tipo] ?? '/inicio')}
      accessibilityRole="button"
      accessibilityLabel={`${n.titulo}. ${n.cuerpo}${n.leida ? '' : ', sin leer'}`}
      style={styles.tarjeta}>
      <View style={{ width: 44, height: 44 }}>
        <Image source={i.circulo} style={StyleSheet.absoluteFill} />
        <Image source={i.icono} style={{ position: 'absolute', left: i.x, top: i.y, width: i.w, height: i.h }} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.tituloNoti} numberOfLines={1}>
          {n.titulo}
        </Text>
        <Text style={styles.cuerpo} numberOfLines={2}>
          {n.cuerpo}
        </Text>
        <Text style={styles.hace}>{hace(n.creadaEn)}</Text>
      </View>
      {!n.leida && <Image source={img.noLeida} style={styles.punto} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 0 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { flex: 1, fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 12 },
  marcar: { fontFamily: Fuentes.bold, fontSize: 13, color: Colores.verde },
  grupo: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginTop: 20, marginBottom: 10 },
  tarjeta: {
    minHeight: 81,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 28,
    paddingVertical: 12,
  },
  tituloNoti: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  cuerpo: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 3 },
  hace: { fontFamily: Fuentes.bold, fontSize: 11, color: '#7A7A7A', marginTop: 3 },
  punto: { position: 'absolute', top: 15, right: 13, width: 10, height: 10 },
  alDia: { fontFamily: Fuentes.bold, fontSize: 13, color: '#6F6F6F', textAlign: 'center', marginTop: 28 },
});
