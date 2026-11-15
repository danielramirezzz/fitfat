import { Image } from 'expo-image';
import { Href, router, useFocusEffect } from 'expo-router';
import { ReactNode, useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Avatar, BotonCerrarSesion, Cabecera, ModalCerrarSesion } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import { cargarPerfil, DatosPerfil, elegirFoto, useFoto } from '@/lib/perfil';
import { cambioFavorable, formatoKg, miles } from '@/lib/progreso';
import { useSesion } from '@/lib/sesion';

const img = {
  fueguito: require('@/assets/figma/perfil/fueguito.svg'),
  pesa: require('@/assets/figma/perfil/pesa.svg'),
  peso: require('@/assets/figma/perfil/peso.svg'),
  circuloVerde: require('@/assets/figma/perfil/circulo-verde.svg'),
  circuloAmbar: require('@/assets/figma/perfil/circulo-ambar.svg'),
  circuloAzul: require('@/assets/figma/perfil/circulo-azul.svg'),
  circuloMorado: require('@/assets/figma/perfil/circulo-morado.svg'),
  lapiz: require('@/assets/figma/perfil/lapiz.svg'),
  trofeo: require('@/assets/figma/perfil/trofeo.svg'),
  campana: require('@/assets/figma/perfil/campana.svg'),
  ajustes: require('@/assets/figma/perfil/ajustes.svg'),
  flecha: require('@/assets/figma/perfil/flecha.svg'),
};

function Dato({ icono, etiqueta, valor, verde }: { icono: ReactNode; etiqueta: string; valor: string; verde?: boolean }) {
  return (
    <View style={styles.dato} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <View style={styles.datoFila}>
        <View style={styles.datoIcono}>{icono}</View>
        <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      </View>
      <Text style={[styles.datoValor, verde && { color: Colores.verde }]} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
    </View>
  );
}

type ItemProps = { circulo: number; icono: ReactNode; titulo: string; insignia?: string; href: Href; ultimo?: boolean };

function Item({ circulo, icono, titulo, insignia, href, ultimo }: ItemProps) {
  return (
    <>
      <Pressable
        onPress={() => router.push(href)}
        accessibilityRole="button"
        accessibilityLabel={insignia ? `${titulo}, ${insignia}` : titulo}
        style={({ pressed }) => [styles.item, pressed && { backgroundColor: '#1D1D1D' }]}>
        <View style={styles.circulo}>
          <Image source={circulo} style={StyleSheet.absoluteFill} />
          {icono}
        </View>
        <Text style={styles.itemTitulo}>{titulo}</Text>
        {insignia ? (
          <View style={styles.insignia}>
            <Text style={styles.insigniaTexto}>{insignia}</Text>
          </View>
        ) : null}
        <Image source={img.flecha} style={{ width: 7.2, height: 12.2, marginLeft: 14 }} />
      </Pressable>
      {!ultimo && <View style={styles.separador} />}
    </>
  );
}

// "Pantalla perfil"
export default function Perfil() {
  const { usuario } = useSesion();
  const foto = useFoto(usuario?.id);
  const [datos, setDatos] = useState<DatosPerfil | null>(null);
  const [error, setError] = useState('');
  const [confirmarSalida, setConfirmarSalida] = useState(false);

  // Reload every time the screen is shown (e.g. after editing the profile).
  useFocusEffect(
    useCallback(() => {
      cargarPerfil()
        .then((d) => {
          setDatos(d);
          setError('');
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar tu perfil.'));
    }, []),
  );

  const cambiarFoto = async () => {
    if (!usuario) return;
    try {
      await elegirFoto(usuario.id);
    } catch {
      avisar('No se pudo abrir la galería', 'Revisa que FitFat tenga permiso para ver tus fotos.');
    }
  };

  const u = datos?.usuario ?? usuario;
  const cambio = datos?.cambioPesoKg ?? null;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Mi perfil" />

      <View style={{ marginTop: 22 }}>
        <Avatar foto={foto} grande alEditar={cambiarFoto} />
      </View>
      <Text style={styles.nombre} numberOfLines={1}>
        {u?.nombre ?? u?.usuario ?? ''}
      </Text>
      <Text style={styles.sub}>
        @{u?.usuario}
        {datos ? ` · Nivel ${datos.nivel.nivel} · ${miles(datos.nivel.puntos)} pts` : ''}
      </Text>

      {!datos ? (
        <View style={styles.cargando}>
          {error ? <Text style={styles.sub}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      ) : (
        <>
          <View style={styles.datos}>
            <Dato
              icono={<Image source={img.fueguito} style={{ width: 14.96, height: 21.56 }} />}
              etiqueta="Racha"
              valor={`${datos.racha} ${datos.racha === 1 ? 'día' : 'días'}`}
              verde={datos.racha > 0}
            />
            <Dato
              icono={<Image source={img.pesa} style={{ width: 17, height: 10.33 }} />}
              etiqueta="Rutinas"
              valor={String(datos.rutinas)}
            />
            <Dato
              icono={<Image source={img.peso} style={{ width: 15.33, height: 15.33 }} />}
              etiqueta="Peso"
              valor={cambio === null ? '—' : formatoKg(cambio)}
              verde={cambio !== null && cambioFavorable(cambio, datos.usuario.objetivo)}
            />
          </View>

          <View style={styles.menu}>
            <Item
              circulo={img.circuloVerde}
              icono={<Image source={img.lapiz} style={{ width: 17.05, height: 16.33 }} />}
              titulo="Editar perfil"
              href="/editar-perfil"
            />
            <Item
              circulo={img.circuloAmbar}
              icono={<Image source={img.trofeo} style={{ width: 15.4, height: 16.23 }} />}
              titulo="Mis logros"
              insignia={`${datos.logros.desbloqueados}/${datos.logros.total}`}
              href="/perfil/logros"
            />
            <Item
              circulo={img.circuloAzul}
              icono={<Image source={img.campana} style={{ width: 15.4, height: 15.4 }} />}
              titulo="Notificaciones"
              insignia={datos.notificacionesNoLeidas > 0 ? String(datos.notificacionesNoLeidas) : undefined}
              href="/notificaciones"
            />
            <Item
              circulo={img.circuloMorado}
              icono={<Image source={img.ajustes} style={{ width: 15.4, height: 15.4 }} />}
              titulo="Ajustes"
              href="/ajustes"
              ultimo
            />
          </View>
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <BotonCerrarSesion onPress={() => setConfirmarSalida(true)} />
      </View>
      <Text style={styles.version}>FitFat v1.0 · Tú eres tu único rival</Text>

      <ModalCerrarSesion visible={confirmarSalida} alCancelar={() => setConfirmarSalida(false)} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  nombre: { fontFamily: Fuentes.bold, fontSize: 22, color: Colores.texto, textAlign: 'center', marginTop: 8 },
  sub: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, textAlign: 'center', marginTop: 4 },
  cargando: { height: 200, alignItems: 'center', justifyContent: 'center' },

  datos: { flexDirection: 'row', gap: 7, marginTop: 24 },
  dato: {
    flex: 1,
    height: 78,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  datoFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  datoIcono: { width: 18, height: 22, alignItems: 'center', justifyContent: 'center' },
  datoEtiqueta: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  datoValor: { fontFamily: Fuentes.bold, fontSize: 20, color: Colores.texto, marginTop: 8 },

  menu: {
    marginTop: 18,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    overflow: 'hidden',
  },
  item: { height: 58, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, paddingRight: 20 },
  circulo: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  itemTitulo: { flex: 1, fontFamily: Fuentes.bold, fontSize: 16, color: Colores.texto, marginLeft: 12 },
  insignia: {
    minWidth: 32,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 12,
    backgroundColor: Colores.verde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insigniaTexto: { fontFamily: Fuentes.bold, fontSize: 12, color: '#000000' },
  separador: { height: 1, backgroundColor: '#262626', marginHorizontal: 16 },

  version: { fontFamily: Fuentes.regular, fontSize: 12, color: '#6F6F6F', textAlign: 'center', marginTop: 16 },
});
