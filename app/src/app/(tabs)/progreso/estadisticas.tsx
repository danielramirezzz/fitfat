import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/texto';
import { GraficaPeso } from '@/components/grafica-peso';
import { Pantalla } from '@/components/pantalla';
import { BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import {
  cambioFavorable,
  cargarEstadisticas,
  DatosEstadisticas,
  formatoKg,
  guardarPeso,
  Logro,
  Periodo,
} from '@/lib/progreso';

const img = {
  racha: require('@/assets/figma/progreso/logro-racha-circulo.svg'),
  rachaFuego: require('@/assets/figma/progreso/logro-racha-fuego.svg'),
  rutina: require('@/assets/figma/progreso/logro-rutina-circulo.svg'),
  rutinaPesa: require('@/assets/figma/progreso/logro-rutina-pesa.svg'),
  agua: require('@/assets/figma/progreso/logro-agua-circulo.svg'),
  aguaGota: require('@/assets/figma/progreso/logro-agua-gota.svg'),
  bloqueado: require('@/assets/figma/progreso/logro-bloq-circulo.svg'),
  candadoCuerpo: require('@/assets/figma/progreso/candado-cuerpo.svg'),
  candadoArco: require('@/assets/figma/progreso/candado-arco.svg'),
  puntoVerde: require('@/assets/figma/progreso/punto-verde.svg'),
  puntoRojo: require('@/assets/figma/progreso/punto-rojo.svg'),
  puntoNaranja: require('@/assets/figma/progreso/punto-naranja.svg'),
  puntoAzul: require('@/assets/figma/progreso/punto-azul.svg'),
};

const PERIODOS: { clave: Periodo; nombre: string }[] = [
  { clave: 'semana', nombre: 'Semana' },
  { clave: 'mes', nombre: 'Mes' },
  { clave: 'ano', nombre: 'Año' },
];

const BORDE_LOGRO = { racha: '#FFC400', rutina: Colores.verde, agua: '#2D9CFF' };

// "Pantalla estadísticas".
export default function Estadisticas() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [datos, setDatos] = useState<DatosEstadisticas | null>(null);
  const [error, setError] = useState('');
  const [editandoPeso, setEditandoPeso] = useState(false);
  const [pesoNuevo, setPesoNuevo] = useState('');

  const cargar = useCallback((p: Periodo) => {
    setError('');
    cargarEstadisticas(p)
      .then(setDatos)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar.'));
  }, []);

  useFocusEffect(useCallback(() => cargar(periodo), [cargar, periodo]));

  const elegir = (p: Periodo) => {
    setPeriodo(p);
    cargar(p);
  };

  const guardar = async () => {
    const kg = Number(pesoNuevo.replace(',', '.'));
    try {
      await guardarPeso(kg);
      setEditandoPeso(false);
      setPesoNuevo('');
      cargar(periodo);
    } catch (e) {
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Revisa el valor.');
    }
  };

  // 3 unlocked achievements (the most advanced) + the next one to unlock.
  const logros = (() => {
    if (!datos) return [];
    const ok = datos.logros.lista.filter((l) => l.desbloqueado);
    const pendientes = datos.logros.lista.filter((l) => !l.desbloqueado);
    const elegidos = [...ok.slice(-3), ...pendientes.slice(0, 1)];
    return [...elegidos, ...pendientes.slice(1)].slice(0, 4);
  })();

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => (router.canGoBack() ? router.back() : router.replace('/progreso'))} />
        <Text style={styles.titulo}>Estadísticas</Text>
      </View>

      <View style={styles.periodos} accessibilityRole="tablist">
        {PERIODOS.map((p) => (
          <Pressable
            key={p.clave}
            onPress={() => elegir(p.clave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: periodo === p.clave }}
            style={[styles.periodo, periodo === p.clave && styles.periodoActivo]}>
            <Text style={[styles.textoPeriodo, periodo === p.clave && { color: '#000' }]}>{p.nombre}</Text>
          </Pressable>
        ))}
      </View>

      {!datos ? (
        <View style={styles.cargando}>
          {error ? <Text style={styles.gris}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      ) : (
        <>
          {/* Weight */}
          <View style={styles.peso}>
            <View style={styles.filaPeso}>
              <Text style={styles.etiqueta}>Peso</Text>
              <Text style={styles.pesoActual}>
                {datos.pesoActual !== null ? formatoKg(datos.pesoActual, false) : '—'}
              </Text>
            </View>
            {datos.puntos.some((p) => p.kg !== null) ? (
              <View style={{ marginTop: 14 }}>
                <GraficaPeso puntos={datos.puntos} />
              </View>
            ) : (
              <Text style={[styles.gris, { marginTop: 30, textAlign: 'center' }]}>Registra tu peso para ver tu progreso</Text>
            )}
            <View style={styles.piePeso}>
              <Text
                style={[
                  styles.cambio,
                  { color: datos.cambio && cambioFavorable(datos.cambio, datos.objetivo) ? Colores.verde : Colores.textoSecundario },
                ]}>
                {datos.cambio === null ? 'Sin cambios aún' : `${formatoKg(datos.cambio)} ${datos.textoCambio}`}
              </Text>
              <Pressable onPress={() => setEditandoPeso((v) => !v)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.actualizar}>{editandoPeso ? 'Cerrar' : 'Actualizar peso'}</Text>
              </Pressable>
            </View>
            {editandoPeso && (
              <View style={styles.editarPeso}>
                <TextInput
                  value={pesoNuevo}
                  onChangeText={setPesoNuevo}
                  placeholder="Ej: 79,5"
                  placeholderTextColor={Colores.placeholder}
                  keyboardType="decimal-pad"
                  style={styles.inputPeso}
                  onSubmitEditing={guardar}
                  autoFocus
                />
                <Text style={styles.gris}>kg</Text>
                <Pressable onPress={guardar} style={styles.guardarPeso} accessibilityRole="button">
                  <Text style={styles.textoGuardar}>Guardar</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Achievements */}
          <View style={styles.filaLogros}>
            <Text style={styles.etiquetaGrande}>Logros</Text>
            <Text style={styles.contador}>
              {datos.logros.desbloqueados} de {datos.logros.total}
            </Text>
          </View>
          <View style={styles.logros}>
            {logros.map((l) => (
              <TarjetaLogro key={l.clave} logro={l} />
            ))}
          </View>

          {/* Summary */}
          <View style={styles.resumen}>
            <Fila punto={img.puntoVerde} texto="Rutinas completadas" valor={String(datos.resumen.rutinas)} />
            <Fila punto={img.puntoRojo} texto="Grupo más entrenado" valor={datos.resumen.grupo ?? '—'} borde />
            <Fila
              punto={img.puntoNaranja}
              texto="Días con registro de comida"
              valor={`${datos.resumen.diasComida} / ${datos.resumen.diasPeriodo}`}
              borde
            />
            <Fila
              punto={img.puntoAzul}
              texto="Agua promedio"
              valor={datos.resumen.aguaPromedio ? `${datos.resumen.aguaPromedio} vasos/día` : '—'}
              borde
            />
          </View>
        </>
      )}
    </Pantalla>
  );
}

function TarjetaLogro({ logro: l }: { logro: Logro }) {
  return (
    <Pressable
      onPress={() => avisar(l.nombre, `${l.descripcion}.\n\n${l.desbloqueado ? '¡Logro desbloqueado!' : 'Aún no lo desbloqueas. ¡Tú puedes!'}`)}
      accessibilityRole="button"
      accessibilityLabel={`${l.nombre}${l.desbloqueado ? '' : ', bloqueado'}`}
      style={[
        styles.logro,
        l.desbloqueado ? { borderColor: BORDE_LOGRO[l.tipo] } : styles.logroBloqueado,
      ]}>
      <View style={styles.circuloLogro}>
        {!l.desbloqueado ? (
          <>
            <Image source={img.bloqueado} style={StyleSheet.absoluteFill} />
            <Image source={img.candadoArco} style={{ position: 'absolute', left: 17, top: 11, width: 14.4, height: 11.2 }} />
            <Image source={img.candadoCuerpo} style={{ position: 'absolute', left: 15, top: 22, width: 18, height: 14 }} />
          </>
        ) : l.tipo === 'racha' ? (
          <>
            <Image source={img.racha} style={StyleSheet.absoluteFill} />
            <Image source={img.rachaFuego} style={{ position: 'absolute', left: 14.8, top: 3.4, width: 19.04, height: 29.24 }} />
          </>
        ) : l.tipo === 'rutina' ? (
          <>
            <Image source={img.rutina} style={StyleSheet.absoluteFill} />
            <Image source={img.rutinaPesa} style={{ width: 22, height: 12 }} />
          </>
        ) : (
          <>
            <Image source={img.agua} style={StyleSheet.absoluteFill} />
            <Image source={img.aguaGota} style={{ width: 18, height: 25 }} />
          </>
        )}
      </View>
      <Text style={[styles.nombreLogro, !l.desbloqueado && { color: Colores.textoApagado }]} numberOfLines={2}>
        {l.nombre}
      </Text>
    </Pressable>
  );
}

function Fila({ punto, texto, valor, borde }: { punto: number; texto: string; valor: string; borde?: boolean }) {
  return (
    <View style={[styles.fila, borde && { borderTopWidth: 1, borderTopColor: '#262626' }]}>
      <Image source={punto} style={{ width: 12, height: 12 }} />
      <Text style={styles.textoFila} numberOfLines={1}>
        {texto}
      </Text>
      <Text style={styles.valorFila}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cargando: { height: 300, alignItems: 'center', justifyContent: 'center' },
  gris: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto, marginLeft: 14 },

  periodos: { marginTop: 18, height: 48, borderRadius: 24, backgroundColor: Colores.campo, flexDirection: 'row', padding: 4 },
  periodo: { flex: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  periodoActivo: { backgroundColor: Colores.verde },
  textoPeriodo: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },

  peso: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    padding: 16,
  },
  filaPeso: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },
  pesoActual: { fontFamily: Fuentes.bold, fontSize: 22, color: Colores.texto },
  piePeso: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  cambio: { fontFamily: Fuentes.bold, fontSize: 14 },
  actualizar: { fontFamily: Fuentes.bold, fontSize: 13, color: Colores.verde },
  editarPeso: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  inputPeso: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colores.campo,
    paddingHorizontal: 16,
    fontFamily: Fuentes.bold,
    fontSize: 16,
    color: Colores.texto,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  guardarPeso: { height: 42, paddingHorizontal: 18, borderRadius: 21, backgroundColor: Colores.verde, justifyContent: 'center' },
  textoGuardar: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: '#000' },

  filaLogros: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 },
  etiquetaGrande: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto },
  contador: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario },
  logros: { flexDirection: 'row', gap: 8, marginTop: 10 },
  logro: {
    flex: 1,
    height: 105,
    borderRadius: 14,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  logroBloqueado: { backgroundColor: '#111111', borderColor: Colores.bordeTarjeta, borderStyle: 'dashed' },
  circuloLogro: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  nombreLogro: { fontFamily: Fuentes.etiqueta, fontSize: 13, color: Colores.texto, textAlign: 'center', marginTop: 12 },

  resumen: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
  },
  fila: { flexDirection: 'row', alignItems: 'center', height: 49, paddingHorizontal: 16, gap: 10 },
  textoFila: { flex: 1, fontFamily: Fuentes.regular, fontSize: 14, color: Colores.texto },
  valorFila: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto },
});
