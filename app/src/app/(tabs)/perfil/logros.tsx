import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cargarPerfil, DatosPerfil } from '@/lib/perfil';
import { Logro } from '@/lib/progreso';

const img = {
  copaCirculo: require('@/assets/figma/perfil/lg-copa-circulo.svg'),
  copa: require('@/assets/figma/perfil/lg-copa.svg'),
  circuloFuego: require('@/assets/figma/perfil/lg-circulo-fuego.svg'),
  fueguito: require('@/assets/figma/perfil/lg-fueguito.svg'),
  circuloPesa: require('@/assets/figma/perfil/lg-circulo-pesa.svg'),
  pesa: require('@/assets/figma/perfil/lg-pesa.svg'),
  circuloGota: require('@/assets/figma/perfil/lg-circulo-gota.svg'),
  gota: require('@/assets/figma/perfil/lg-gota.svg'),
  circuloBloqueado: require('@/assets/figma/perfil/lg-circulo-bloqueado.svg'),
  candado: require('@/assets/figma/perfil/lg-candado.svg'),
};

// Look of each achievement type (border color, circle and icon from Figma).
const ESTILO: Record<Logro['tipo'], { borde: string; circulo: number; icono: number; tam: { width: number; height: number } }> = {
  racha: { borde: '#FF6A1F', circulo: img.circuloFuego, icono: img.fueguito, tam: { width: 28.56, height: 41.16 } },
  rutina: { borde: Colores.verde, circulo: img.circuloPesa, icono: img.pesa, tam: { width: 26.2, height: 15.53 } },
  agua: { borde: '#4A9EFF', circulo: img.circuloGota, icono: img.gota, tam: { width: 18.2, height: 24.87 } },
};

function Medalla({ logro }: { logro: Logro }) {
  const e = ESTILO[logro.tipo];
  const ok = logro.desbloqueado;
  return (
    <View
      style={[styles.medalla, ok && { borderColor: e.borde }]}
      accessible
      accessibilityLabel={`${logro.nombre}: ${logro.descripcion}. ${ok ? 'Logrado' : 'Bloqueado'}`}>
      <View style={styles.circulo}>
        {ok ? (
          <>
            <Image source={e.circulo} style={{ position: 'absolute', width: 62, height: 62 }} />
            <Image source={e.icono} style={e.tam} />
          </>
        ) : (
          <>
            <Image source={img.circuloBloqueado} style={{ position: 'absolute', width: 60, height: 60 }} />
            <Image source={img.candado} style={{ width: 17.17, height: 21.5 }} />
          </>
        )}
      </View>
      <Text style={[styles.nombre, !ok && { color: '#7A7A7A' }]} numberOfLines={1} adjustsFontSizeToFit>
        {logro.nombre}
      </Text>
      <Text style={[styles.estado, !ok && { color: '#5A5A5A' }]}>{ok ? '¡Logrado!' : 'Bloqueado'}</Text>
    </View>
  );
}

// "Pantalla logros": the 12 achievements, unlocked ones first.
export default function MisLogros() {
  const [datos, setDatos] = useState<DatosPerfil | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarPerfil()
        .then(setDatos)
        .catch((e) => setError(e instanceof Error ? e.message : 'No se pudieron cargar tus logros.'));
    }, []),
  );

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  if (!datos) {
    return (
      <Pantalla estiloContenido={styles.contenido}>
        <Cabecera titulo="Mis logros" alVolver={volver} />
        <View style={styles.cargando}>
          {error ? <Text style={styles.sub}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      </Pantalla>
    );
  }

  const { total, desbloqueados, proximo, lista } = datos.logros;
  const ordenados = [...lista].sort((a, b) => Number(b.desbloqueado) - Number(a.desbloqueado));

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Mis logros" alVolver={volver} />

      <View style={styles.resumen}>
        <View style={styles.copa}>
          <Image source={img.copaCirculo} style={StyleSheet.absoluteFill} />
          <Image source={img.copa} style={{ width: 21.27, height: 22.46 }} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.resumenTitulo}>
            {desbloqueados} de {total} desbloqueados
          </Text>
          <View style={styles.barra}>
            <View style={[styles.barraLlena, { width: `${(desbloqueados / total) * 100}%` }]} />
          </View>
          <Text style={styles.sub}>{proximo ? `Próximo: ${proximo}` : '¡Desbloqueaste todos los logros!'}</Text>
        </View>
      </View>

      <View style={styles.rejilla}>
        {ordenados.map((l) => (
          <Medalla key={l.clave} logro={l} />
        ))}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  cargando: { height: 300, alignItems: 'center', justifyContent: 'center' },
  sub: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 6 },

  resumen: {
    marginTop: 24,
    height: 92,
    borderRadius: Radios.tarjeta,
    borderWidth: 1,
    borderColor: Colores.verde,
    backgroundColor: '#14241A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 18,
  },
  copa: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  resumenTitulo: { fontFamily: Fuentes.bold, fontSize: 17, color: Colores.texto },
  barra: { height: 10, borderRadius: 5, backgroundColor: '#2C2C2C', marginTop: 8, overflow: 'hidden' },
  barraLlena: { height: 10, borderRadius: 5, backgroundColor: Colores.verde },

  rejilla: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 22 },
  medalla: {
    width: '31.5%',
    height: 128,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 2,
  },
  circulo: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontFamily: Fuentes.bold, fontSize: 12.5, color: Colores.texto, marginTop: 10, textAlign: 'center' },
  estado: { fontFamily: Fuentes.bold, fontSize: 11, color: Colores.verde, marginTop: 2 },
});
