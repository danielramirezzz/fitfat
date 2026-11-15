import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Boton, BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import {
  cargarConfig,
  cargarNotificaciones,
  ConfigAlertas,
  FRECUENCIAS,
  guardarConfig,
  HORAS,
  horaBonita,
  programarRecordatorios,
  TipoAlerta,
  TIPOS,
} from '@/lib/alertas';
import { dispararAviso, pedirPermisoNavegador, recargarAvisos } from '@/lib/avisador';
import { avisar } from '@/lib/avisos';
import { useSesion } from '@/lib/sesion';

const img = {
  cuadroPush: require('@/assets/figma/alertas/cuadro-push.svg'),
  campana: require('@/assets/figma/alertas/campana.svg'),
  cuadroCorreo: require('@/assets/figma/alertas/cuadro-correo.svg'),
  sobre: require('@/assets/figma/alertas/sobre.svg'),
  cuadroSms: require('@/assets/figma/alertas/cuadro-sms.svg'),
  globo: require('@/assets/figma/alertas/globo.svg'),
  on: require('@/assets/figma/alertas/interruptor-on.svg'),
  off: require('@/assets/figma/alertas/interruptor-off.svg'),
  check: require('@/assets/figma/alertas/check-chip.svg'),
  mas: require('@/assets/figma/alertas/mas-chip.svg'),
  relojCirculo: require('@/assets/figma/alertas/reloj-circulo.svg'),
  relojManecillas: require('@/assets/figma/alertas/reloj-manecillas.svg'),
  flecha: require('@/assets/figma/alertas/flecha-abajo.svg'),
  bombilloA: require('@/assets/figma/alertas/bombillo-a.svg'),
  bombilloB: require('@/assets/figma/alertas/bombillo-b.svg'),
  puntoNoLeida: require('@/assets/figma/alertas/punto-no-leida.svg'),
  campanaBarra: require('@/assets/figma/nav/alertas.svg'),
};

type Config = Omit<ConfigAlertas, 'guardada'>;

// "Pantalla canales y tipos de alerta" (Recordatorios).
export default function Recordatorios() {
  const { usuario } = useSesion();
  const [config, setConfig] = useState<Config | null>(null);
  const [abierto, setAbierto] = useState<'hora' | 'frecuencia' | null>(null);
  const [noLeidas, setNoLeidas] = useState(0);
  const [guardando, setGuardando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarConfig()
        .then(({ guardada: _, ...c }) => setConfig(c))
        .catch(() => {});
      cargarNotificaciones()
        .then((r) => setNoLeidas(r.noLeidas))
        .catch(() => {});
    }, []),
  );

  if (!config) {
    return (
      <Pantalla>
        <ActivityIndicator color={Colores.verde} style={{ marginTop: 120 }} />
      </Pantalla>
    );
  }

  const cambiar = (c: Partial<Config>) => setConfig({ ...config, ...c });
  const alternarTipo = (t: TipoAlerta) =>
    cambiar({ tipos: config.tipos.includes(t) ? config.tipos.filter((x) => x !== t) : [...config.tipos, t] });

  // The tip follows the first chosen alert type.
  const tip = TIPOS.find((t) => t.clave === config.tipos[0])?.tip ?? 'Activa al menos un tipo de alerta.';

  const guardar = async () => {
    setGuardando(true);
    try {
      await pedirPermisoNavegador(); // browser: allow notifications outside the page (after this tap)
      await guardarConfig(config);
      const estado = await programarRecordatorios(config);
      await recargarAvisos();
      if (estado === 'sin-permiso') {
        avisar('Permiso necesario', 'Activa las notificaciones de FitFat en los ajustes del celular para recibir tus recordatorios.');
      }
      router.push('/alerta-guardada');
    } catch (e) {
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.navigate('/inicio')} />
        <Text style={styles.titulo}>Recordatorios</Text>
        <Pressable
          onPress={() => router.push('/notificaciones')}
          accessibilityRole="button"
          accessibilityLabel={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ''}`}
          style={styles.botonCampana}>
          <Image source={img.campanaBarra} style={{ width: 16, height: 18 }} tintColor="#FFFFFF" />
          {noLeidas > 0 && <Image source={img.puntoNoLeida} style={styles.puntoCampana} />}
        </Pressable>
      </View>

      <Text style={styles.etiqueta}>Canales de notificación</Text>
      <View style={styles.canales}>
        <Canal cuadro={img.cuadroPush} icono={img.campana} ancho={16} alto={18.4} izq={12} arriba={11} nombre="Notificaciones push" activo={config.push} onPress={() => cambiar({ push: !config.push })} />
        <Canal cuadro={img.cuadroCorreo} icono={img.sobre} ancho={18} alto={14} izq={11} arriba={13} nombre="Correo electrónico" activo={config.correo} onPress={() => cambiar({ correo: !config.correo })} borde />
        <Canal cuadro={img.cuadroSms} icono={img.globo} ancho={18} alto={16} izq={11} arriba={12} nombre="Mensaje de texto (SMS)" activo={config.sms} onPress={() => cambiar({ sms: !config.sms })} borde />
      </View>

      <Text style={styles.etiqueta}>Tipos de alerta</Text>
      <View style={styles.chips}>
        {TIPOS.map((t) => {
          const activo = config.tipos.includes(t.clave);
          return (
            <Pressable
              key={t.clave}
              onPress={() => alternarTipo(t.clave)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activo }}
              style={[styles.chip, activo ? styles.chipActivo : styles.chipInactivo]}>
              {activo ? (
                <Image source={img.check} style={{ width: 13.2, height: 10.2 }} />
              ) : (
                <Image source={img.mas} style={{ width: 12, height: 12 }} />
              )}
              <Text style={[styles.textoChip, activo && { color: '#000' }]}>{t.nombre}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Time and frequency, each with its own drop-down list */}
      <View style={styles.filaSelectores}>
        <View style={{ flex: 1 }}>
          <Text style={styles.etiquetaCorta}>Hora</Text>
          <Pressable onPress={() => setAbierto(abierto === 'hora' ? null : 'hora')} style={styles.selector} accessibilityRole="button">
            <Text style={styles.textoSelector}>{horaBonita(config.hora)}</Text>
            <View style={{ width: 20, height: 20 }}>
              <Image source={img.relojCirculo} style={StyleSheet.absoluteFill} />
              <Image source={img.relojManecillas} style={{ position: 'absolute', left: 8, top: 3, width: 5, height: 9 }} />
            </View>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.etiquetaCorta}>Frecuencia</Text>
          <Pressable onPress={() => setAbierto(abierto === 'frecuencia' ? null : 'frecuencia')} style={styles.selector} accessibilityRole="button">
            <Text style={styles.textoSelector} numberOfLines={1}>
              {FRECUENCIAS.find((f) => f.clave === config.frecuencia)?.nombre}
            </Text>
            <Image source={img.flecha} style={{ width: 12.2, height: 7.2, transform: [{ rotate: abierto === 'frecuencia' ? '180deg' : '0deg' }] }} />
          </Pressable>
        </View>
      </View>

      {abierto === 'hora' && (
        <ScrollView
          style={styles.lista}
          nestedScrollEnabled
          // Open the list right at the chosen time (42 px per row).
          ref={(r) => r?.scrollTo({ y: Math.max(0, HORAS.indexOf(config.hora) * 42 - 79), animated: false })}>
          {HORAS.map((h) => (
            <Pressable
              key={h}
              onPress={() => {
                cambiar({ hora: h });
                setAbierto(null);
              }}
              style={[styles.opcion, h === config.hora && styles.opcionActiva]}>
              <Text style={[styles.textoOpcion, h === config.hora && { color: Colores.verde }]}>{horaBonita(h)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {abierto === 'frecuencia' && (
        <View style={styles.lista}>
          {FRECUENCIAS.map((f) => (
            <Pressable
              key={f.clave}
              onPress={() => {
                cambiar({ frecuencia: f.clave });
                setAbierto(null);
              }}
              style={[styles.opcion, f.clave === config.frecuencia && styles.opcionActiva]}>
              <Text style={[styles.textoOpcion, f.clave === config.frecuencia && { color: Colores.verde }]}>{f.nombre}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.tip}>
        <View style={{ width: 22, height: 28 }}>
          <Image source={img.bombilloA} style={{ width: 22, height: 22 }} />
          <Image source={img.bombilloB} style={{ position: 'absolute', left: 6, top: 23, width: 10, height: 5 }} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.tituloTip}>Tip para crear el hábito</Text>
          <Text style={styles.textoTip}>{tip}</Text>
        </View>
      </View>

      {/* Extras (not in Figma): try a notification right now + FitFat Premium */}
      <Pressable
        onPress={async () => {
          await pedirPermisoNavegador();
          dispararAviso(config.tipos[0] ?? 'motivacion', 'ahora', true);
        }}
        accessibilityRole="button"
        style={({ pressed }) => [styles.probar, pressed && { opacity: 0.8 }]}>
        <Text style={styles.textoProbar}>🔔  Probar notificación ahora</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/premium')}
        accessibilityRole="button"
        accessibilityLabel="FitFat Premium: mensajes motivacionales"
        style={({ pressed }) => [styles.premium, pressed && { opacity: 0.85 }]}>
        <Text style={{ fontSize: 26 }}>👑</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.tituloPremium}>{usuario?.premium ? 'FitFat Premium activo' : 'Hazte FitFat Premium'}</Text>
          <Text style={styles.textoPremium}>Mensajes motivacionales con tu nombre y tu racha, hasta 4 veces al día.</Text>
        </View>
        <Text style={styles.flechaPremium}>›</Text>
      </Pressable>

      <View style={styles.botones}>
        <Boton texto="Cancelar" variante="gris" onPress={() => router.push('/alerta-cancelada')} estilo={{ width: 141 }} />
        <Boton texto={guardando ? 'Guardando…' : 'Guardar'} onPress={guardar} deshabilitado={guardando} estilo={{ flex: 1 }} />
      </View>
    </Pantalla>
  );
}

type CanalProps = {
  cuadro: number;
  icono: number;
  ancho: number;
  alto: number;
  izq: number;
  arriba: number;
  nombre: string;
  activo: boolean;
  onPress: () => void;
  borde?: boolean;
};

function Canal({ cuadro, icono, ancho, alto, izq, arriba, nombre, activo, onPress, borde }: CanalProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: activo }}
      accessibilityLabel={nombre}
      style={[styles.canal, borde && styles.separador]}>
      <View style={{ width: 40, height: 40 }}>
        <Image source={cuadro} style={StyleSheet.absoluteFill} />
        <Image source={icono} style={{ position: 'absolute', left: izq, top: arriba, width: ancho, height: alto }} />
      </View>
      <Text style={styles.nombreCanal}>{nombre}</Text>
      <Image source={activo ? img.on : img.off} style={{ width: 48, height: 28 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  probar: {
    marginTop: 16,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: Colores.verde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoProbar: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.verde },
  premium: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFC93C',
    backgroundColor: '#211A08',
  },
  tituloPremium: { fontFamily: Fuentes.bold, fontSize: 15, color: '#FFC93C' },
  textoPremium: { fontFamily: Fuentes.regular, fontSize: 12, lineHeight: 17, color: Colores.textoClaro, marginTop: 2 },
  flechaPremium: { fontFamily: Fuentes.bold, fontSize: 24, color: '#FFC93C', marginLeft: 8 },
  contenido: { paddingTop: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { flex: 1, fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 14 },
  botonCampana: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puntoCampana: { position: 'absolute', top: 9, right: 10, width: 10, height: 10 },

  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto, marginTop: 20, marginLeft: 4 },
  canales: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
  },
  canal: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  separador: { borderTopWidth: 1, borderTopColor: '#262626' },
  nombreCanal: { flex: 1, fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginLeft: 14 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingLeft: 13, paddingRight: 14, gap: 6 },
  chipActivo: { backgroundColor: Colores.verde },
  chipInactivo: { backgroundColor: '#2C2C2C', borderWidth: 1, borderColor: '#4A4A4A' },
  textoChip: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.texto },

  filaSelectores: { flexDirection: 'row', gap: 12, marginTop: 18 },
  etiquetaCorta: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto, marginLeft: 4, marginBottom: 8 },
  selector: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3A3A3A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 16,
  },
  textoSelector: { flexShrink: 1, fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  lista: {
    marginTop: 8,
    maxHeight: 200,
    borderRadius: 16,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: Colores.verde,
  },
  opcion: { height: 42, justifyContent: 'center', paddingHorizontal: 18 },
  opcionActiva: { backgroundColor: 'rgba(30,255,60,0.1)' },
  textoOpcion: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },

  tip: {
    marginTop: 20,
    minHeight: 70,
    borderRadius: 16,
    backgroundColor: '#2A2200',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 19,
    paddingVertical: 12,
  },
  tituloTip: { fontFamily: Fuentes.bold, fontSize: 14, color: '#FFD000' },
  textoTip: { fontFamily: Fuentes.regular, fontSize: 13, color: '#E6E6E6', marginTop: 4 },

  botones: { flexDirection: 'row', gap: 11, marginTop: 34 },
});
