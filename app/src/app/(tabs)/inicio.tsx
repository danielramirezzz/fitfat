import { Image } from 'expo-image';
import { Href, router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { Colores, Fuentes } from '@/constants/theme';
import { cargarInicio, DatosInicio, DiaRacha, mensajeRacha } from '@/lib/inicio';
import { useFoto } from '@/lib/perfil';
import { formatoKg } from '@/lib/progreso';
import { useSesion } from '@/lib/sesion';

// Figma graphics for this screen (assets/figma/inicio/*.svg), shown as images.
const img = {
  avatarCirculo: require('@/assets/figma/inicio/avatar-circulo.svg'),
  avatarCabeza: require('@/assets/figma/inicio/avatar-cabeza.svg'),
  avatarCuerpo: require('@/assets/figma/inicio/avatar-cuerpo.svg'),
  fueguito: require('@/assets/figma/inicio/fueguito-grande.svg'),
  fueguitoApagado: require('@/assets/images/fueguito-apagado.png'),
  fuegoDia: require('@/assets/figma/inicio/fuego-dia.svg'),
  fuegoApagado: require('@/assets/figma/inicio/fuego-apagado.svg'),
  hoyCirculo: require('@/assets/figma/inicio/hoy-circulo.svg'),
  hoyMas: require('@/assets/figma/inicio/hoy-mas.svg'),
  cuadroPesa: require('@/assets/figma/inicio/cuadro-pesa.svg'),
  pesa: require('@/assets/figma/inicio/pesa.svg'),
  cuadroManzana: require('@/assets/figma/inicio/cuadro-manzana.svg'),
  manzana: require('@/assets/figma/inicio/manzana.svg'),
  cuadroCampana: require('@/assets/figma/inicio/cuadro-campana.svg'),
  campana: require('@/assets/figma/inicio/campana.svg'),
  insignia: require('@/assets/figma/inicio/insignia.svg'),
  cuadroGrafica: require('@/assets/figma/inicio/cuadro-grafica.svg'),
  grafica: require('@/assets/figma/inicio/grafica.svg'),
};

// "Pantalla principal" from Figma.
export default function Inicio() {
  const { usuario } = useSesion();
  const foto = useFoto(usuario?.id);
  const [datos, setDatos] = useState<DatosInicio | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    setError('');
    cargarInicio()
      .then(setDatos)
      .catch((e) => {
        // Session expired → back to Login. Otherwise show a retry message.
        if (e?.estado === 401) router.replace('/login');
        else setError(e instanceof Error ? e.message : 'No se pudo cargar.');
      });
  }, []);

  // Reload every time the tab comes into view (e.g. after finishing a routine).
  useFocusEffect(cargar);

  const nombre = usuario?.nombre?.split(' ')[0] ?? usuario?.usuario ?? '';

  return (
    <Pantalla estiloContenido={styles.contenido}>
      {/* Greeting + avatar (→ Perfil) */}
      <View style={styles.cabecera}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hola}>Hola, {nombre}</Text>
          <Text style={styles.pregunta}>¿Qué deseas{'\n'}hacer hoy?</Text>
        </View>
        <Pressable
          onPress={() => router.push('/perfil')}
          accessibilityRole="button"
          accessibilityLabel="Abrir mi perfil"
          style={styles.avatar}>
          <Image source={img.avatarCirculo} style={StyleSheet.absoluteFill} />
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatarFoto} contentFit="cover" />
          ) : (
            <>
              <Image source={img.avatarCabeza} style={styles.avatarCabeza} />
              <Image source={img.avatarCuerpo} style={styles.avatarCuerpo} />
            </>
          )}
        </Pressable>
      </View>

      <TarjetaRacha datos={datos} error={error} onReintentar={cargar} />

      {/* 2x2 grid of shortcuts */}
      <View style={styles.fila}>
        <Tarjeta href="/rutinas" estilo={styles.tarjetaVerde}>
          <Cuadro fondo={img.cuadroPesa} icono={img.pesa} ancho={30} alto={18} />
          <View style={styles.pildoraPts}>
            <Text style={styles.textoPts}>+50 pts</Text>
          </View>
          <Text style={[styles.tituloTarjeta, styles.abajoTitulo, { color: '#000' }]}>Rutinas rápidas</Text>
          <Text
            style={[styles.subTarjeta, styles.abajoSub, { color: '#000' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            Elige un grupo muscular
          </Text>
        </Tarjeta>

        <Tarjeta href="/comida">
          <Cuadro fondo={img.cuadroManzana} icono={img.manzana} ancho={22} alto={25} />
          <Text style={[styles.tituloTarjeta, styles.tituloDosLineas]}>Alimentos{'\n'}y hábitos</Text>
          <View style={styles.barra}>
            <View
              style={[
                styles.barraLlena,
                { width: `${datos ? Math.min(1, datos.comidas.hoy / datos.comidas.meta) * 100 : 0}%` },
              ]}
            />
          </View>
          <Text style={[styles.subTarjeta, styles.textoComidas]}>
            {datos ? `${datos.comidas.hoy} de ${datos.comidas.meta} comidas hoy` : ' '}
          </Text>
        </Tarjeta>
      </View>

      <View style={styles.fila}>
        {/* Red badge = unread notifications; tapping opens them (or the settings if none). */}
        <Tarjeta href={datos?.notificacionesNoLeidas ? '/notificaciones' : '/alertas'}>
          <View>
            <Cuadro fondo={img.cuadroCampana} icono={img.campana} ancho={22} alto={24.5} />
            {!!datos?.notificacionesNoLeidas && (
              <View style={styles.insignia}>
                <Image source={img.insignia} style={StyleSheet.absoluteFill} />
                <Text style={styles.textoInsignia}>{Math.min(9, datos.notificacionesNoLeidas)}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tituloTarjeta, styles.abajoTitulo]}>Recordatorios</Text>
          <Text style={[styles.subTarjeta, styles.abajoSub]}>
            {!datos
              ? ' '
              : datos.alertasActivas === 0
                ? 'Configura tus alertas'
                : `${datos.alertasActivas} ${datos.alertasActivas === 1 ? 'alerta activa' : 'alertas activas'}`}
          </Text>
        </Tarjeta>

        <Tarjeta href="/progreso">
          <Cuadro fondo={img.cuadroGrafica} icono={img.grafica} ancho={24} alto={22} />
          {datos?.cambioPesoKg != null && (
            <View style={styles.pildoraKg}>
              <Text style={styles.textoKg}>{formatoKg(datos.cambioPesoKg)}</Text>
            </View>
          )}
          <Text style={[styles.tituloTarjeta, styles.abajoTitulo]}>Progreso</Text>
          <Text style={[styles.subTarjeta, styles.abajoSub]}>Mira tus estadísticas</Text>
        </Tarjeta>
      </View>
    </Pantalla>
  );
}

// Streak card: big fueguito, title, message and the last 7 days.
function TarjetaRacha({ datos, error, onReintentar }: { datos: DatosInicio | null; error: string; onReintentar: () => void }) {
  if (!datos) {
    return (
      <View style={[styles.tarjetaRacha, styles.centrado]}>
        {error ? (
          <Pressable onPress={onReintentar} style={{ alignItems: 'center', gap: 8, paddingHorizontal: 20 }}>
            <Text style={styles.mensajeRacha}>{error}</Text>
            <Text style={styles.reintentar}>Toca para reintentar</Text>
          </Pressable>
        ) : (
          <ActivityIndicator color={Colores.verde} />
        )}
      </View>
    );
  }

  const { dias, hoyActivo, semana } = datos.racha;
  const encendido = dias > 0 || hoyActivo;

  return (
    <View style={styles.tarjetaRacha} accessible accessibilityLabel={`${dias} días de racha`}>
      <View style={styles.filaRacha}>
        <Image
          source={encendido ? img.fueguito : img.fueguitoApagado}
          style={styles.fueguito}
          contentFit="contain"
        />
        <View style={{ flex: 1, marginLeft: 27 }}>
          <Text style={styles.tituloRacha}>
            {dias} {dias === 1 ? 'día' : 'días'} de racha
          </Text>
          <Text style={styles.mensajeRacha}>{mensajeRacha(dias, hoyActivo)}</Text>
        </View>
      </View>

      <View style={styles.semana}>
        {semana.map((d) => (
          <Dia key={d.fecha} dia={d} />
        ))}
      </View>
    </View>
  );
}

function Dia({ dia }: { dia: DiaRacha }) {
  const color = dia.hoy ? Colores.verde : dia.activo ? Colores.texto : Colores.textoApagado;
  return (
    <View style={styles.dia}>
      <View style={styles.iconoDia}>
        {dia.activo ? (
          <Image source={img.fuegoDia} style={{ width: 16.8, height: 25.8 }} />
        ) : dia.hoy ? (
          // Today without activity: dashed green circle with a "+" (invitation).
          <View style={styles.hoy}>
            <Image source={img.hoyCirculo} style={StyleSheet.absoluteFill} />
            <Image source={img.hoyMas} style={{ width: 10, height: 10 }} />
          </View>
        ) : (
          <Image source={img.fuegoApagado} style={{ width: 13.2, height: 25.8 }} />
        )}
      </View>
      <Text style={[styles.letraDia, { color }]}>{dia.letra}</Text>
    </View>
  );
}

// Grid card (175x182, radius 20). Tapping it opens its tab.
function Tarjeta({ href, estilo, children }: { href: Href; estilo?: ViewStyle; children: ReactNode }) {
  return (
    <Pressable
      onPress={() => router.navigate(href)}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tarjeta, estilo, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

// 56px rounded square (gradient background) with its icon centered.
function Cuadro({ fondo, icono, ancho, alto }: { fondo: number; icono: number; ancho: number; alto: number }) {
  return (
    <View style={styles.cuadro}>
      <Image source={fondo} style={StyleSheet.absoluteFill} />
      <Image source={icono} style={{ width: ancho, height: alto }} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 3, paddingBottom: 24 },

  cabecera: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 },
  hola: { fontFamily: Fuentes.regular, fontSize: 16, color: Colores.textoClaro },
  pregunta: { fontFamily: Fuentes.bold, fontSize: 30, lineHeight: 36, color: Colores.texto, marginTop: 4 },
  avatar: { width: 52, height: 52, marginTop: 9, alignItems: 'center' },
  avatarCabeza: { position: 'absolute', top: 11, width: 16, height: 16 },
  avatarFoto: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3, borderRadius: 100 },
  avatarCuerpo: { position: 'absolute', top: 31, width: 30, height: 11 },

  tarjetaRacha: {
    marginTop: 24,
    height: 181,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    borderRadius: 20,
    paddingTop: 13,
  },
  centrado: { alignItems: 'center', justifyContent: 'center', paddingTop: 0 },
  filaRacha: { flexDirection: 'row', paddingLeft: 27, paddingRight: 16 },
  fueguito: { width: 43.4, height: 66.65 },
  tituloRacha: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginTop: 3 },
  mensajeRacha: {
    fontFamily: Fuentes.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Colores.textoClaro,
    marginTop: 4,
    maxWidth: 200, // same wrapping as Figma
  },
  reintentar: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde },

  semana: { position: 'absolute', top: 102, left: 0, right: 0, flexDirection: 'row' },
  dia: { flex: 1, alignItems: 'center' },
  iconoDia: { height: 28, justifyContent: 'flex-end', alignItems: 'center' },
  hoy: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  letraDia: { fontFamily: Fuentes.etiqueta, fontSize: 14, marginTop: 15 },

  fila: { flexDirection: 'row', gap: 12, marginTop: 12 },
  tarjeta: {
    flex: 1,
    height: 182,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2E2E2E',
    padding: 16,
  },
  tarjetaVerde: { backgroundColor: Colores.verde, borderColor: Colores.verde },
  cuadro: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },

  pildoraPts: {
    position: 'absolute',
    top: 16,
    right: 16,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  textoPts: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: '#FFD000' },
  pildoraKg: {
    position: 'absolute',
    top: 18,
    right: 16,
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: '#0F2E14',
    justifyContent: 'center',
  },
  textoKg: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde },

  tituloTarjeta: { fontFamily: Fuentes.bold, fontSize: 17, color: Colores.texto },
  subTarjeta: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  abajoTitulo: { position: 'absolute', left: 16, top: 120 },
  abajoSub: { position: 'absolute', left: 16, right: 8, top: 146 },
  tituloDosLineas: { position: 'absolute', left: 16, top: 98, lineHeight: 20 },
  barra: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 149,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    overflow: 'hidden',
  },
  barraLlena: { height: 6, borderRadius: 3, backgroundColor: '#FF8A00' },
  textoComidas: { position: 'absolute', left: 16, top: 160, fontSize: 12 },

  insignia: {
    position: 'absolute',
    left: 41,
    top: -5,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoInsignia: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.texto },
});
