import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/texto';
import { IconoAlimento } from '@/components/icono-alimento';
import { Pantalla } from '@/components/pantalla';
import { Boton, BotonVolver } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import {
  Alimento,
  buscarAlimentos,
  cargarHoy,
  ClaveComida,
  comidaSegunHora,
  guardarRegistro,
  Habitos,
  PESTANAS,
} from '@/lib/comida';

const img = {
  lupaCirculo: require('@/assets/figma/comida/lupa-circulo.svg'),
  lupaMango: require('@/assets/figma/comida/lupa-mango.svg'),
  agregar: require('@/assets/figma/comida/agregar.svg'),
  agregarMas: require('@/assets/figma/comida/agregar-mas.svg'),
  quitar: require('@/assets/figma/comida/quitar.svg'),
  menos: require('@/assets/figma/comida/menos.svg'),
  mas: require('@/assets/figma/comida/mas.svg'),
  cuadroSueno: require('@/assets/figma/comida/cuadro-sueno.svg'),
  luna: require('@/assets/figma/comida/luna.svg'),
  cuadroEjercicio: require('@/assets/figma/comida/cuadro-ejercicio.svg'),
  pesa: require('@/assets/figma/comida/pesa.svg'),
  fueguito: require('@/assets/figma/comida/fueguito-banner.svg'),
};

type Listas = Record<ClaveComida, Alimento[]>;
const VACIAS: Listas = { desayuno: [], almuerzo: [], cena: [], snack: [] };

// "Pantalla registro alimentos y hábitos".
export default function RegistroComida() {
  const params = useLocalSearchParams<{ comida?: ClaveComida }>();
  const [pestana, setPestana] = useState<ClaveComida>(params.comida ?? comidaSegunHora());
  const [listas, setListas] = useState<Listas>(VACIAS);
  const [habitos, setHabitos] = useState<Habitos>({ agua: 0, sueno: 0, ejercicio: false });
  const [metaAgua, setMetaAgua] = useState(8);
  const [cargado, setCargado] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [guardando, setGuardando] = useState(false);

  // Coming from the meal plan with ?comida=almuerzo opens that tab
  // (React's "adjust state when a prop changes" pattern, no effect needed).
  const [comidaPrevia, setComidaPrevia] = useState(params.comida);
  if (params.comida !== comidaPrevia) {
    setComidaPrevia(params.comida);
    if (params.comida) setPestana(params.comida);
  }

  // Load what was already logged today every time the screen is shown.
  useFocusEffect(
    useCallback(() => {
      cargarHoy()
        .then((d) => {
          setListas(d.comidas);
          setHabitos(d.habitos);
          setMetaAgua(d.metaAgua);
        })
        .catch(() => {})
        .finally(() => setCargado(true));
    }, []),
  );

  // Search suggestions, 250 ms after the user stops typing.
  useEffect(() => {
    const q = busqueda.trim();
    if (!q) return;
    const t = setTimeout(() => {
      buscarAlimentos(q)
        .then((r) => setResultados(r.resultados))
        .catch(() => setResultados([]));
    }, 250);
    return () => clearTimeout(t);
  }, [busqueda]);

  const lista = listas[pestana];
  const sugerencias = busqueda.trim() ? resultados : [];

  const agregar = (a: Alimento) => {
    setListas((l) => ({ ...l, [pestana]: [...l[pestana], a] }));
    setBusqueda('');
    setResultados([]);
  };

  // "+" adds what was typed: the first suggestion if it matches, else a custom food.
  const agregarEscrito = () => {
    const t = busqueda.trim();
    if (!t) return;
    const igual = sugerencias.find((s) => s.nombre.toLowerCase() === t.toLowerCase());
    agregar(igual ?? { nombre: t.charAt(0).toUpperCase() + t.slice(1), porcion: '1 porción', categoria: 'otro' });
  };

  const quitar = (i: number) => setListas((l) => ({ ...l, [pestana]: l[pestana].filter((_, j) => j !== i) }));

  const guardar = async () => {
    setGuardando(true);
    try {
      await guardarRegistro(pestana, lista, habitos);
      router.push('/comida-guardada');
    } catch (e) {
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const nombrePestana = PESTANAS.find((p) => p.clave === pestana)!.nombre.toLowerCase();

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.navigate('/inicio')} />
        <Text style={styles.titulo}>Alimentos y hábitos</Text>
      </View>

      {/* Meal tabs */}
      <View style={styles.pestanas} accessibilityRole="tablist">
        {PESTANAS.map((p) => (
          <Pressable
            key={p.clave}
            onPress={() => setPestana(p.clave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === p.clave }}
            style={[styles.pestana, pestana === p.clave && styles.pestanaActiva]}>
            <Text style={[styles.textoPestana, pestana === p.clave && { color: '#000' }]}>{p.nombre}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.etiqueta}>¿Qué comiste?</Text>
      <View style={styles.filaBuscar}>
        <View style={styles.buscar}>
          <Image source={img.lupaCirculo} style={{ position: 'absolute', left: 15, top: 14, width: 16, height: 16 }} />
          <Image source={img.lupaMango} style={{ position: 'absolute', left: 27, top: 26, width: 7, height: 7 }} />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Busca un alimento"
            placeholderTextColor={Colores.textoClaro}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={agregarEscrito}
          />
        </View>
        <Pressable onPress={agregarEscrito} accessibilityRole="button" accessibilityLabel="Agregar alimento" style={styles.agregar}>
          <Image source={img.agregar} style={StyleSheet.absoluteFill} />
          <Image source={img.agregarMas} style={{ width: 22.6, height: 22.6 }} />
        </Pressable>
      </View>

      {sugerencias.length > 0 && (
        <View style={styles.sugerencias}>
          {sugerencias.map((s) => (
            <Pressable key={s.nombre} onPress={() => agregar(s)} style={styles.sugerencia} accessibilityRole="button">
              <IconoAlimento categoria={s.categoria} />
              <Text style={styles.nombre} numberOfLines={1}>
                {s.nombre}
              </Text>
              <Text style={styles.porcion}>{s.porcion}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Foods of the selected meal */}
      <View style={styles.lista}>
        {!cargado ? (
          <ActivityIndicator color={Colores.verde} style={{ padding: 18 }} />
        ) : lista.length === 0 ? (
          <Text style={styles.vacio}>Aún no agregas alimentos a tu {nombrePestana}.</Text>
        ) : (
          lista.map((a, i) => (
            <View key={`${a.nombre}-${i}`} style={[styles.fila, i > 0 && styles.separador]}>
              <IconoAlimento categoria={a.categoria} />
              <Text style={styles.nombre} numberOfLines={1}>
                {a.nombre}
              </Text>
              <Text style={styles.porcion}>{a.porcion}</Text>
              <Pressable onPress={() => quitar(i)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Quitar ${a.nombre}`}>
                <Image source={img.quitar} style={{ width: 12, height: 12 }} />
              </Pressable>
            </View>
          ))
        )}
      </View>

      <Text style={styles.etiqueta}>Hábitos de hoy</Text>
      <View style={styles.filaHabitos}>
        {/* Water: - / + glasses */}
        <View style={[styles.habito, { height: 112 }]}>
          <Text style={styles.textoAgua}>Agua</Text>
          <View style={styles.contador}>
            <Pressable
              onPress={() => setHabitos((h) => ({ ...h, agua: Math.max(0, h.agua - 1) }))}
              accessibilityRole="button"
              accessibilityLabel="Un vaso menos">
              <Image source={img.menos} style={{ width: 36, height: 36 }} />
            </Pressable>
            <Text style={styles.cuenta}>
              {habitos.agua}/{metaAgua}
            </Text>
            <Pressable
              onPress={() => setHabitos((h) => ({ ...h, agua: Math.min(20, h.agua + 1) }))}
              accessibilityRole="button"
              accessibilityLabel="Un vaso más">
              <Image source={img.mas} style={{ width: 36, height: 36 }} />
            </Pressable>
          </View>
          <View style={styles.barraAgua}>
            <View style={[styles.barraAguaLlena, { width: `${Math.min(1, habitos.agua / metaAgua) * 100}%` }]} />
          </View>
          <Text style={styles.vasos}>vasos</Text>
        </View>

        {/* Sleep: hours last night (± half an hour) */}
        <View style={[styles.habito, { height: 112, paddingTop: 16 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.cuadro36}>
              <Image source={img.cuadroSueno} style={StyleSheet.absoluteFill} />
              <Image source={img.luna} style={{ width: 15.3, height: 15.8 }} />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.tituloHabito}>Sueño</Text>
              <Text style={styles.subHabito}>{String(habitos.sueno).replace('.', ',')} h anoche</Text>
            </View>
          </View>
          <View style={styles.filaSueno}>
            <Pressable
              onPress={() => setHabitos((h) => ({ ...h, sueno: Math.max(0, h.sueno - 0.5) }))}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Media hora menos de sueño">
              <Image source={img.menos} style={{ width: 22, height: 22 }} />
            </Pressable>
            <View style={styles.barraSueno}>
              <View style={[styles.barraSuenoLlena, { width: `${Math.min(1, habitos.sueno / 8) * 100}%` }]} />
            </View>
            <Pressable
              onPress={() => setHabitos((h) => ({ ...h, sueno: Math.min(16, h.sueno + 0.5) }))}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Media hora más de sueño">
              <Image source={img.mas} style={{ width: 22, height: 22 }} />
            </Pressable>
          </View>
          <Text style={styles.meta}>Meta: 8 horas</Text>
        </View>
      </View>

      {/* Exercise switch */}
      <Pressable
        onPress={() => setHabitos((h) => ({ ...h, ejercicio: !h.ejercicio }))}
        accessibilityRole="switch"
        accessibilityState={{ checked: habitos.ejercicio }}
        style={styles.ejercicio}>
        <View style={styles.cuadro36}>
          <Image source={img.cuadroEjercicio} style={StyleSheet.absoluteFill} />
          <Image source={img.pesa} style={{ width: 22, height: 12 }} />
        </View>
        <Text style={[styles.tituloHabito, { flex: 1, marginLeft: 12 }]}>Hice ejercicio hoy</Text>
        <View style={[styles.interruptor, !habitos.ejercicio && styles.interruptorOff]}>
          <View style={[styles.bola, habitos.ejercicio ? { right: 3 } : { left: 3, backgroundColor: '#8F8F8F' }]} />
        </View>
      </Pressable>

      <View style={styles.banner}>
        <Image source={img.fueguito} style={{ width: 22.4, height: 34.4 }} />
        <Text style={styles.textoBanner}>Registrar hoy mantiene viva tu racha</Text>
      </View>

      <View style={styles.botones}>
        <Boton texto="Cancelar" variante="gris" onPress={() => router.push('/comida-cancelada')} estilo={{ width: 141 }} />
        <Boton
          texto={guardando ? 'Guardando…' : 'Guardar registro'}
          onPress={guardar}
          deshabilitado={guardando}
          estilo={{ flex: 1 }}
        />
      </View>

      <Pressable onPress={() => router.push('/comida/plan')} style={styles.verPlan} hitSlop={6}>
        <Text style={styles.textoVerPlan}>Ver mi plan de alimentación</Text>
      </Pressable>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center' },
  titulo: { fontFamily: Fuentes.bold, fontSize: 23, color: Colores.texto, marginLeft: 14 },

  pestanas: {
    marginTop: 17,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colores.campo,
    flexDirection: 'row',
    padding: 4,
  },
  pestana: { flex: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pestanaActiva: { backgroundColor: Colores.verde },
  textoPestana: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto },

  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 17, color: Colores.texto, marginTop: 18, marginLeft: 4 },
  filaBuscar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  buscar: { flex: 1, height: 48, borderRadius: 24, backgroundColor: '#3A3A3A' },
  input: {
    flex: 1,
    paddingLeft: 42,
    paddingRight: 16,
    fontFamily: Fuentes.regular,
    fontSize: 15,
    color: Colores.texto,
    outlineStyle: 'solid',
    outlineWidth: 0,
  },
  agregar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },

  sugerencias: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: Colores.verde,
    overflow: 'hidden',
  },
  sugerencia: { flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 14, gap: 14 },

  lista: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    minHeight: 56,
    justifyContent: 'center',
  },
  vacio: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoApagado, textAlign: 'center', padding: 18 },
  fila: { flexDirection: 'row', alignItems: 'center', height: 56, paddingLeft: 14, paddingRight: 22, gap: 14 },
  separador: { borderTopWidth: 1, borderTopColor: Colores.bordeTarjeta },
  nombre: { flex: 1, fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  porcion: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoSecundario },

  filaHabitos: { flexDirection: 'row', gap: 12, marginTop: 8 },
  habito: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    paddingHorizontal: 12,
  },
  textoAgua: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoSecundario, marginTop: 9 },
  contador: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  cuenta: { fontFamily: Fuentes.bold, fontSize: 17, color: Colores.texto },
  barraAgua: { height: 6, borderRadius: 3, backgroundColor: '#2C2C2C', marginTop: 11, overflow: 'hidden' },
  barraAguaLlena: { height: 6, borderRadius: 3, backgroundColor: Colores.verde },
  vasos: { fontFamily: Fuentes.regular, fontSize: 12, color: '#A8A8A8', textAlign: 'center', marginTop: 2 },
  cuadro36: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tituloHabito: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  subHabito: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 3 },
  filaSueno: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  barraSueno: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#2C2C2C', overflow: 'hidden' },
  barraSuenoLlena: { height: 10, borderRadius: 5, backgroundColor: '#A259FF' },
  meta: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 6 },

  ejercicio: {
    marginTop: 10,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  interruptor: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colores.verde, justifyContent: 'center' },
  interruptorOff: { backgroundColor: '#3A3A3A' },
  bola: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#000' },

  banner: {
    marginTop: 10,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1400',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    gap: 10,
  },
  textoBanner: { fontFamily: Fuentes.bold, fontSize: 13, color: '#FF8A00' },

  botones: { flexDirection: 'row', gap: 11, marginTop: 16 },
  verPlan: { alignSelf: 'center', marginTop: 14 },
  textoVerPlan: { fontFamily: Fuentes.bold, fontSize: 13, color: Colores.verde },
});
