import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Pantalla } from '@/components/pantalla';
import { BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { cargarPlan, ComidaPlan, DatosPlan } from '@/lib/comida';

const img = {
  diaOff: require('@/assets/figma/comida/dia-off.svg'),
  diaOn: require('@/assets/figma/comida/dia-on.svg'),
  puntoVerde: require('@/assets/figma/comida/punto-verde.svg'),
  puntoGris: require('@/assets/figma/comida/punto-gris.svg'),
  checkCirculo: require('@/assets/figma/comida/check-circulo.svg'),
  check: require('@/assets/figma/comida/check.svg'),
  vacioVerde: require('@/assets/figma/comida/circulo-vacio-verde.svg'),
  vacioGris: require('@/assets/figma/comida/circulo-vacio-gris.svg'),
  cuadroDesayuno: require('@/assets/figma/comida/cuadro-desayuno.svg'),
  solA: require('@/assets/figma/comida/sol-a.svg'),
  solB: require('@/assets/figma/comida/sol-b.svg'),
  cuadroMedia: require('@/assets/figma/comida/cuadro-media.svg'),
  manzanaA: require('@/assets/figma/comida/manzana-a.svg'),
  manzanaB: require('@/assets/figma/comida/manzana-b.svg'),
  cuadroAlmuerzo: require('@/assets/figma/comida/cuadro-almuerzo.svg'),
  platoA: require('@/assets/figma/comida/plato-a.svg'),
  platoB: require('@/assets/figma/comida/plato-b.svg'),
  tenedor: require('@/assets/figma/comida/tenedor.svg'),
  cuadroCena: require('@/assets/figma/comida/cuadro-cena.svg'),
  luna: require('@/assets/figma/comida/luna-cena.svg'),
};

const abs = (left: number, top: number, width: number, height: number) =>
  ({ position: 'absolute', left, top, width, height }) as const;

// "Pantalla plan de alimentación".
export default function PlanAlimentacion() {
  const [fecha, setFecha] = useState<string | undefined>(undefined); // undefined = today
  const [plan, setPlan] = useState<DatosPlan | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback((f?: string) => {
    setError('');
    cargarPlan(f)
      .then(setPlan)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar el plan.'));
  }, []);

  useFocusEffect(useCallback(() => cargar(fecha), [cargar, fecha]));

  const elegirDia = (f: string) => {
    setFecha(f);
    cargar(f);
  };

  const hoy = plan?.semana.find((d) => d.hoy)?.fecha;
  const esHoy = plan?.fecha === hoy;
  const avance = plan ? plan.hechas / plan.total : 0;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => (router.canGoBack() ? router.back() : router.replace('/comida'))} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.titulo}>Tu plan de alimentación</Text>
          <Text style={styles.sub}>Objetivo: {(plan?.objetivo ?? 'mantenerme').toLowerCase()}</Text>
        </View>
      </View>

      {!plan ? (
        <View style={styles.cargando}>
          {error ? <Text style={styles.sub}>{error}</Text> : <ActivityIndicator color={Colores.verde} />}
        </View>
      ) : (
        <>
          {/* Week: Monday to Sunday */}
          <View style={styles.semana}>
            {plan.semana.map((d) => {
              const elegido = d.fecha === plan.fecha;
              return (
                <Pressable
                  key={d.fecha}
                  onPress={() => elegirDia(d.fecha)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: elegido }}
                  accessibilityLabel={`${d.dia} ${d.numero}`}
                  style={styles.dia}>
                  <View style={styles.chip}>
                    <Image source={elegido ? img.diaOn : img.diaOff} style={StyleSheet.absoluteFill} />
                    <Text style={[styles.textoDia, elegido && { color: '#000' }]}>{d.dia}</Text>
                    <Text style={[styles.numero, elegido && { color: '#000' }]}>{d.numero}</Text>
                  </View>
                  <View style={{ height: 6, marginTop: 8 }}>
                    {!d.futuro && (
                      <Image source={d.registrado ? img.puntoVerde : img.puntoGris} style={{ width: 6, height: 6 }} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.resumen}>
            <View style={styles.filaResumen}>
              <Text style={styles.textoResumen}>
                {esHoy ? 'Hoy llevas' : 'Ese día registraste'} {plan.hechas} de {plan.total} comidas
              </Text>
              <Text style={styles.porcentaje}>{Math.round(avance * 100)}%</Text>
            </View>
            <View style={styles.barra}>
              <View style={[styles.barraLlena, { width: `${avance * 100}%` }]} />
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 14 }}>
            {plan.comidas.map((c) => (
              <TarjetaComida
                key={c.clave}
                comida={c}
                onPress={
                  esHoy && !c.hecho
                    ? // Go back to the log screen already in the stack (or open it), on this meal's tab.
                      () => router.dismissTo({ pathname: '/comida', params: { comida: c.registro } })
                    : undefined
                }
              />
            ))}
          </View>

          <Text style={styles.aviso}>
            Plan orientativo. Consulta a un profesional de{'\n'}la salud antes de hacer cambios grandes.
          </Text>
        </>
      )}
    </Pantalla>
  );
}

function TarjetaComida({ comida: c, onPress }: { comida: ComidaPlan; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${c.nombre}: ${c.plato}${c.hecho ? ', registrado' : ''}`}
      style={[styles.tarjeta, c.ahora && !c.hecho && styles.tarjetaAhora]}>
      <IconoMomento clave={c.clave} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.momento}>
          {c.nombre.toUpperCase()} · {c.hora.toUpperCase()}
          {c.ahora && !c.hecho ? ' · AHORA' : ''}
        </Text>
        <Text style={styles.plato} numberOfLines={1}>
          {c.plato}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {c.detalle}
        </Text>
      </View>
      <View style={styles.estado}>
        {c.hecho ? (
          <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
            <Image source={img.checkCirculo} style={StyleSheet.absoluteFill} />
            <Image source={img.check} style={{ width: 11.7, height: 8.7 }} />
          </View>
        ) : (
          <Image source={c.ahora ? img.vacioVerde : img.vacioGris} style={{ width: 24, height: 24 }} />
        )}
      </View>
    </Pressable>
  );
}

// 48px icon of each moment of the day (pieces from Figma).
function IconoMomento({ clave }: { clave: ComidaPlan['clave'] }) {
  return (
    <View style={{ width: 48, height: 48 }}>
      {clave === 'desayuno' && (
        <>
          <Image source={img.cuadroDesayuno} style={StyleSheet.absoluteFill} />
          <Image source={img.solB} style={abs(7.9, 7.9, 32.2, 32.2)} />
          <Image source={img.solA} style={abs(17, 17, 14, 14)} />
        </>
      )}
      {clave === 'media' && (
        <>
          <Image source={img.cuadroMedia} style={StyleSheet.absoluteFill} />
          <Image source={img.manzanaA} style={abs(13, 13, 22, 20.33)} />
          <Image source={img.manzanaB} style={abs(24, 8, 5, 6)} />
        </>
      )}
      {clave === 'almuerzo' && (
        <>
          <Image source={img.cuadroAlmuerzo} style={StyleSheet.absoluteFill} />
          <Image source={img.platoA} style={abs(13.7, 11.7, 24.6, 24.6)} />
          <Image source={img.platoB} style={abs(21, 19, 10, 10)} />
          <Image source={img.tenedor} style={abs(4, 11, 8, 26)} />
        </>
      )}
      {clave === 'cena' && (
        <>
          <Image source={img.cuadroCena} style={StyleSheet.absoluteFill} />
          <Image source={img.luna} style={abs(12.9, 14, 19.08, 19.81)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cargando: { height: 300, alignItems: 'center', justifyContent: 'center' },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 21, color: Colores.texto },
  sub: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoSecundario, marginTop: 4 },

  semana: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  dia: { alignItems: 'center' },
  chip: { width: 47, height: 61, alignItems: 'center' },
  textoDia: { fontFamily: Fuentes.etiqueta, fontSize: 12, color: Colores.texto, marginTop: 13 },
  numero: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto, marginTop: 2 },

  resumen: { marginTop: 12, height: 58, borderRadius: 16, backgroundColor: '#0F2E14', paddingHorizontal: 16, justifyContent: 'center' },
  filaResumen: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textoResumen: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.texto },
  porcentaje: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.verde },
  barra: { height: 8, borderRadius: 4, backgroundColor: '#1F4A28', marginTop: 9, overflow: 'hidden' },
  barraLlena: { height: 8, borderRadius: 4, backgroundColor: Colores.verde },

  tarjeta: {
    height: 92,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
  },
  tarjetaAhora: { borderColor: Colores.verde, borderWidth: 1.5 },
  momento: { fontFamily: Fuentes.etiqueta, fontSize: 14, color: Colores.verde },
  plato: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginTop: 4 },
  detalle: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 5 },
  estado: { alignSelf: 'flex-start', marginTop: 10 },

  aviso: { fontFamily: Fuentes.regular, fontSize: 12, lineHeight: 18, color: '#A8A8A8', textAlign: 'center', marginTop: 24 },
});
