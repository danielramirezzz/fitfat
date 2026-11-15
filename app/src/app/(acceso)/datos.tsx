import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { IconoCalendario, IconoFlecha, IconoUsuario } from '@/components/iconos-acceso';
import { Pantalla } from '@/components/pantalla';
import { Regla } from '@/components/regla';
import { BarraPaso, Boton, BotonVolver, CampoTexto, Chip } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { avisar } from '@/lib/avisos';
import { fechaParaServidor, formatearFecha, validarFecha } from '@/lib/registro';
import { guardarPerfil } from '@/lib/sesion';

const GENEROS = ['Hombre', 'Mujer', 'Otro'] as const;
const OBJETIVOS = ['Perder peso', 'Ganar músculo', 'Mantenerme'] as const;

// "Pantalla de datos" (step 2 of 2).
export default function Datos() {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [genero, setGenero] = useState<string | null>(null);
  const [estatura, setEstatura] = useState(165);
  const [peso, setPeso] = useState(65);
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [intentado, setIntentado] = useState(false); // show errors only after pressing "Siguiente"
  const [cargando, setCargando] = useState(false);

  const errorNombre = nombre.trim().length < 3 ? 'Escribe tu nombre completo' : '';
  const errorFecha = validarFecha(fecha);
  const faltaGenero = !genero;
  const faltaObjetivo = !objetivo;

  const siguiente = async () => {
    setIntentado(true);
    if (errorNombre || errorFecha || !genero || !objetivo || cargando) return;
    setCargando(true);
    try {
      await guardarPerfil({
        nombre: nombre.trim(),
        fechaNacimiento: fechaParaServidor(fecha),
        genero,
        estatura,
        peso,
        objetivo,
      });
      router.replace('/inicio');
    } catch (e) {
      avisar('No se pudieron guardar tus datos', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <View style={styles.cabecera}>
        <BotonVolver onPress={() => router.back()} />
        <Text style={styles.paso}>Paso 2 de 2</Text>
      </View>
      <BarraPaso avance={1} />

      <Text style={styles.titulo}>Queremos conocerte</Text>
      <Text style={styles.subtitulo}>Con esto armamos un plan a tu medida.</Text>

      <View style={styles.formulario}>
        <CampoTexto
          etiqueta="Nombre completo"
          placeholder="Escribe tu nombre completo"
          icono={<IconoUsuario />}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
          textContentType="name"
          error={intentado ? errorNombre : ''}
        />
        <View style={{ height: 12 }} />
        <CampoTexto
          etiqueta="Fecha de nacimiento"
          placeholder="DD / MM / AAAA"
          iconoDerecha={<IconoCalendario />}
          value={fecha}
          onChangeText={(t) => setFecha(formatearFecha(t))}
          keyboardType="number-pad"
          maxLength={10}
          error={intentado ? errorFecha : ''}
        />
      </View>

      <Text style={[styles.etiqueta, { marginTop: 14 }]}>Género</Text>
      <View style={styles.filaGenero}>
        {GENEROS.map((g) => (
          <Chip key={g} texto={g} activo={genero === g} onPress={() => setGenero(g)} estilo={styles.chipGenero} />
        ))}
      </View>
      {intentado && faltaGenero && <Text style={styles.error}>Elige una opción</Text>}

      <View style={{ height: 13 }} />
      <Regla etiqueta="Estatura" unidad="cm" min={140} max={210} valor={estatura} onCambio={setEstatura} />
      <View style={{ height: 12 }} />
      <Regla etiqueta="Peso" unidad="kg" min={40} max={150} valor={peso} onCambio={setPeso} />

      <Text style={[styles.etiqueta, { marginTop: 14 }]}>Tu objetivo</Text>
      <View style={styles.filaObjetivo}>
        {OBJETIVOS.map((o) => (
          <Chip key={o} texto={o} activo={objetivo === o} onPress={() => setObjetivo(o)} estilo={styles.chipObjetivo} tamano={15} />
        ))}
      </View>
      {intentado && faltaObjetivo && <Text style={styles.error}>Elige tu objetivo</Text>}

      <Boton
        texto={cargando ? 'Guardando…' : 'Siguiente'}
        onPress={siguiente}
        icono={cargando ? undefined : <IconoFlecha />}
        estilo={{ marginTop: 30 }}
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 4 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  paso: { fontFamily: Fuentes.etiqueta, fontSize: 15, color: Colores.textoSecundario },
  titulo: { fontFamily: Fuentes.bold, fontSize: 29, color: Colores.texto, marginTop: 17, marginLeft: 4 },
  subtitulo: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoClaro, marginTop: 8, marginLeft: 4 },
  formulario: { marginTop: 19 },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginLeft: 4 },
  filaGenero: { flexDirection: 'row', gap: 10, marginTop: 5, paddingHorizontal: 10 },
  chipGenero: { flex: 1, height: 33 },
  filaObjetivo: { flexDirection: 'row', gap: 10, marginTop: 5 },
  chipObjetivo: { flex: 1, height: 38 },
  error: { fontFamily: Fuentes.medium, fontSize: 12, color: Colores.rojo, marginLeft: 4, marginTop: 4 },
});
