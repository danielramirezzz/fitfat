import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Anillo } from '@/components/anillo';
import { Musica } from '@/components/musica';
import { VideoEjercicio } from '@/components/video-ejercicio';
import { Pantalla } from '@/components/pantalla';
import { Boton } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { hablar, vibrar } from '@/lib/accesibilidad';
import { avisar } from '@/lib/avisos';
import { cantidad, completarRutina, Ejercicio, obtenerRutinaActual, reloj, Rutina } from '@/lib/rutinas';

const img = {
  salir: require('@/assets/figma/rutinas/boton-salir.svg'),
  anterior: require('@/assets/figma/rutinas/boton-anterior.svg'),
  pausa: require('@/assets/figma/rutinas/boton-pausa.svg'),
  siguiente: require('@/assets/figma/rutinas/boton-siguiente.svg'),
  playCirculo: require('@/assets/figma/rutinas/play-circulo.svg'),
  playTriangulo: require('@/assets/figma/rutinas/play-triangulo.svg'),
  gotaCirculo: require('@/assets/figma/rutinas/gota-circulo.svg'),
  gota: require('@/assets/figma/rutinas/gota.svg'),
  cuadroProximo: require('@/assets/figma/rutinas/cuadro-proximo.svg'),
  pesaVerde: require('@/assets/figma/rutinas/pesa-verde.svg'),
};

type Fase = 'trabajo' | 'descanso';
type Paso = { ej: number; serie: number; fase: Fase };

// "Pantalla rutina en curso" + "Pantalla descanso" (same screen, two phases,
// because they share the timer).
export default function Entreno() {
  const rutina = obtenerRutinaActual();
  if (!rutina) return <Redirect href="/rutinas" />; // e.g. after reloading the page
  return <Sesion rutina={rutina} />;
}

function Sesion({ rutina }: { rutina: Rutina }) {
  const ejercicios = rutina.ejercicios;
  const [paso, setPaso] = useState<Paso>({ ej: 0, serie: 1, fase: 'trabajo' });
  const [total, setTotal] = useState(ejercicios[0].duracionSerie); // seconds of this phase
  const [fin, setFin] = useState<number | null>(() => Date.now() + ejercicios[0].duracionSerie * 1000); // null = paused
  const [restantePausado, setRestantePausado] = useState(0);
  const [ahora, setAhora] = useState(() => Date.now());
  const [terminando, setTerminando] = useState(false);

  const restante = fin !== null ? Math.max(0, (fin - ahora) / 1000) : restantePausado;
  const ej = ejercicios[paso.ej];

  // "Guía por voz" (accessibility): says what comes next.
  const anunciar = (p: Paso, segundos: number) => {
    const e = ejercicios[p.ej];
    if (p.fase === 'descanso') hablar(`Descanso de ${segundos} segundos. Respira.`);
    else hablar(`${e.nombre}. Serie ${p.serie} de ${e.series}. ¡Vamos!`);
  };
  const anunciado = useRef(false);
  useEffect(() => {
    if (anunciado.current) return;
    anunciado.current = true;
    anunciar({ ej: 0, serie: 1, fase: 'trabajo' }, ejercicios[0].duracionSerie);
  });
  const ultimoEj = paso.ej === ejercicios.length - 1;
  const ultimaSerie = paso.serie === ej.series;

  const iniciar = (nuevo: Paso, segundos: number) => {
    anunciar(nuevo, segundos);
    vibrar();
    setPaso(nuevo);
    setTotal(segundos);
    setFin(Date.now() + segundos * 1000);
  };

  const irAEjercicio = (i: number) => {
    const destino = Math.min(ejercicios.length - 1, Math.max(0, i));
    iniciar({ ej: destino, serie: 1, fase: 'trabajo' }, ejercicios[destino].duracionSerie);
  };

  const terminarRutina = async () => {
    setFin(null);
    setTerminando(true);
    try {
      await completarRutina(rutina);
      hablar('¡Rutina completada! Muy bien.');
      router.replace('/rutina-completada');
    } catch (e) {
      setTerminando(false);
      avisar('No se pudo guardar la rutina', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    }
  };

  // Work finished → rest (or finish the routine if it was the very last set).
  const terminarSerie = () => {
    if (paso.fase !== 'trabajo' || terminando) return;
    if (ultimoEj && ultimaSerie) terminarRutina();
    else iniciar({ ...paso, fase: 'descanso' }, ej.descanso);
  };

  // Rest finished → next set, or first set of the next exercise.
  const terminarDescanso = () => {
    if (!ultimaSerie) iniciar({ ej: paso.ej, serie: paso.serie + 1, fase: 'trabajo' }, ej.duracionSerie);
    else irAEjercicio(paso.ej + 1);
  };

  // What to do when the countdown reaches 0. Kept in a ref so the timer
  // (created once) always calls the latest version.
  const alVencer = useRef(() => {});
  const finRef = useRef(fin);
  useEffect(() => {
    alVencer.current = paso.fase === 'trabajo' ? terminarSerie : terminarDescanso;
    finRef.current = fin;
  });

  // Tick 4 times per second. The remaining time is computed from the end
  // timestamp, so it stays accurate even if a tick arrives late.
  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setAhora(n);
      if (finRef.current !== null && n >= finRef.current) {
        finRef.current = null; // fire only once; the next render sets the new end
        alVencer.current();
      }
    }, 250);
    return () => clearInterval(t);
  }, []);

  const pausar = () => {
    if (fin !== null) {
      setRestantePausado(restante);
      setFin(null);
    } else {
      setFin(Date.now() + restantePausado * 1000);
    }
  };

  const sumar15 = () => {
    setTotal((t) => t + 15);
    if (fin !== null) setFin(fin + 15000);
    else setRestantePausado((r) => r + 15);
  };

  const salir = () => router.replace({ pathname: '/rutina-cancelada', params: { origen: 'entreno' } });

  const descanso = paso.fase === 'descanso';
  const siguienteEj: Ejercicio | undefined = ejercicios[paso.ej + 1];

  return (
    <Pantalla estiloContenido={styles.contenido}>
      {/* Header: exit + title + segments (one per exercise) */}
      <View style={styles.cabecera}>
        <Pressable onPress={salir} accessibilityRole="button" accessibilityLabel="Salir de la rutina" hitSlop={8}>
          <Image source={img.salir} style={{ width: 44, height: 44 }} />
        </Pressable>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.titulo}>{descanso ? 'Descanso' : rutina.titulo}</Text>
          <Text style={styles.sub}>
            Ejercicio {paso.ej + 1} de {ejercicios.length} · {descanso ? rutina.titulo : `${rutina.minutos} min`}
          </Text>
        </View>
      </View>
      <View style={styles.segmentos}>
        {ejercicios.map((e, i) => (
          <View
            key={e.nombre}
            style={[
              styles.segmento,
              { backgroundColor: i < paso.ej ? Colores.verde : i === paso.ej ? '#7DFF8E' : '#2C2C2C' },
            ]}
          />
        ))}
      </View>

      {descanso ? (
        <>
          <View style={styles.gota}>
            <Image source={img.gotaCirculo} style={StyleSheet.absoluteFill} />
            <Image source={img.gota} style={{ width: 24.2, height: 33.4 }} />
          </View>
          <Text style={styles.buenTrabajo}>¡Buen trabajo!</Text>
          <Text style={styles.respira}>Respira profundo y toma un poco de agua.</Text>

          <View style={{ marginTop: 22 }}>
            <Anillo tamano={182} grosor={14} color="#4DA3FF" progreso={restante / total}>
              <Text style={[styles.tiempo, { fontSize: 40 }]}>{reloj(restante)}</Text>
              <Text style={styles.restante}>de {reloj(total)}</Text>
            </Anillo>
          </View>

          <View style={styles.proximo}>
            <View style={styles.cuadroProximo}>
              <Image source={img.cuadroProximo} style={StyleSheet.absoluteFill} />
              <Image source={img.pesaVerde} style={{ width: 23, height: 13.7 }} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.etiquetaProximo}>
                {ultimaSerie
                  ? `PRÓXIMO EJERCICIO · ${paso.ej + 2} DE ${ejercicios.length}`
                  : `PRÓXIMA SERIE · ${paso.serie + 1} DE ${ej.series}`}
              </Text>
              <Text style={styles.nombreProximo} numberOfLines={1}>
                {ultimaSerie ? siguienteEj?.nombre : ej.nombre}
              </Text>
              <Text style={styles.detalleProximo} numberOfLines={1}>
                {ultimaSerie && siguienteEj ? `${cantidad(siguienteEj)} · ${siguienteEj.detalle}` : `${cantidad(ej)} · ${ej.detalle}`}
              </Text>
            </View>
          </View>

          <View style={styles.botonesDescanso}>
            <Boton texto="+15 segundos" variante="gris" onPress={sumar15} estilo={{ flex: 1 }} />
            <Boton texto="Saltar descanso" onPress={terminarDescanso} estilo={{ flex: 1 }} />
          </View>
          <Text style={styles.auto}>La rutina continuará automáticamente</Text>
          <Musica compacto />
        </>
      ) : (
        <>
          {/* Technique video, inside the app (pauses with the timer) */}
          <VideoEjercicio key={ej.video} clave={ej.video} estilo={styles.video} pausado={fin === null} />

          <Text style={styles.nombreEj}>{ej.nombre.toUpperCase()}</Text>
          <Text style={styles.serie}>
            {ej.series === 1
              ? ej.detalle
              : `Serie ${paso.serie} de ${ej.series} · ${ej.reps ? `${ej.reps} repeticiones` : `${ej.segundos} segundos`}`}
          </Text>

          <View style={{ marginTop: 22 }}>
            <Anillo tamano={160} grosor={12} color={Colores.verde} progreso={restante / total}>
              <Text style={styles.tiempo}>{reloj(restante)}</Text>
              <Text style={styles.restante}>{fin === null ? 'en pausa' : 'restante'}</Text>
            </Anillo>
          </View>

          <View style={styles.controles}>
            <Pressable
              onPress={() => irAEjercicio(paso.ej - 1)}
              disabled={paso.ej === 0}
              accessibilityRole="button"
              accessibilityLabel="Ejercicio anterior"
              style={{ opacity: paso.ej === 0 ? 0.4 : 1 }}>
              <Image source={img.anterior} style={{ width: 61, height: 61 }} />
            </Pressable>
            <Pressable onPress={pausar} accessibilityRole="button" accessibilityLabel={fin === null ? 'Continuar' : 'Pausar'}>
              {fin === null ? (
                <View style={styles.reanudar}>
                  <Image source={img.playCirculo} style={StyleSheet.absoluteFill} />
                  <Image source={img.playTriangulo} style={{ width: 23, height: 28, marginLeft: 6 }} />
                </View>
              ) : (
                <Image source={img.pausa} style={{ width: 80, height: 80 }} />
              )}
            </Pressable>
            <Pressable
              onPress={() => irAEjercicio(paso.ej + 1)}
              disabled={ultimoEj}
              accessibilityRole="button"
              accessibilityLabel="Siguiente ejercicio"
              style={{ opacity: ultimoEj ? 0.4 : 1 }}>
              <Image source={img.siguiente} style={{ width: 61, height: 61 }} />
            </Pressable>
          </View>

          <Musica compacto />

          <View style={styles.siguiente}>
            <Text style={styles.etiquetaSiguiente}>SIGUIENTE</Text>
            <Text style={styles.textoSiguiente} numberOfLines={1}>
              {!ultimaSerie
                ? `${ej.nombre} · serie ${paso.serie + 1} de ${ej.series}`
                : siguienteEj
                  ? `${siguienteEj.nombre} · ${cantidad(siguienteEj)}`
                  : '¡Último esfuerzo! Termina la rutina'}
            </Text>
          </View>

          <Boton
            texto={terminando ? 'Guardando…' : ultimoEj && ultimaSerie ? 'Terminar rutina' : 'Terminar serie'}
            onPress={terminarSerie}
            deshabilitado={terminando}
            estilo={{ marginTop: 22 }}
          />
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 0 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 24, color: Colores.texto },
  sub: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 4 },
  segmentos: { flexDirection: 'row', gap: 6, marginTop: 20 },
  segmento: { flex: 1, height: 6, borderRadius: 3 },

  video: { marginTop: 16, height: 200, borderRadius: 18, overflow: 'hidden' },
  nombreEj: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde, textAlign: 'center', marginTop: 26 },
  serie: { fontFamily: Fuentes.regular, fontSize: 15, color: Colores.textoClaro, textAlign: 'center', marginTop: 10 },
  tiempo: { fontFamily: Fuentes.bold, fontSize: 34, color: Colores.texto },
  restante: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 2 },

  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34, marginTop: 14 },
  reanudar: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  siguiente: {
    marginTop: 18,
    height: 59,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  etiquetaSiguiente: { fontFamily: Fuentes.etiqueta, fontSize: 12, color: Colores.textoApagado },
  textoSiguiente: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.texto, marginTop: 3 },

  gota: { marginTop: 34, width: 80, height: 80, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  buenTrabajo: { fontFamily: Fuentes.bold, fontSize: 26, color: Colores.texto, textAlign: 'center', marginTop: 12 },
  respira: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoClaro, textAlign: 'center', marginTop: 6 },
  proximo: {
    marginTop: 22,
    height: 84,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cuadroProximo: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  etiquetaProximo: { fontFamily: Fuentes.etiqueta, fontSize: 12, color: Colores.textoApagado },
  nombreProximo: { fontFamily: Fuentes.bold, fontSize: 16, color: Colores.texto, marginTop: 2 },
  detalleProximo: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 2 },
  botonesDescanso: { flexDirection: 'row', gap: 12, marginTop: 40 },
  auto: { fontFamily: Fuentes.regular, fontSize: 12, color: '#6F6F6F', textAlign: 'center', marginTop: 14 },
});
