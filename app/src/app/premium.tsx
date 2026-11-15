import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Boton } from '@/components/ui';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cargarConfig, horaBonita, programarRecordatorios } from '@/lib/alertas';
import { dispararAviso, pedirPermisoNavegador, recargarAvisos } from '@/lib/avisador';
import { avisar } from '@/lib/avisos';
import { cargarPremium, guardarPremium, Premium } from '@/lib/premium';

const DORADO = '#FFC93C';
const MAX_HORAS = 4;

const BENEFICIOS = [
  { icono: '💬', titulo: 'Mensajes motivacionales', texto: 'Frases con tu nombre, tu racha y tu objetivo, nunca la misma.' },
  { icono: '⏰', titulo: 'Tú eliges cuándo', texto: 'Hasta 4 horarios al día: al despertar, antes de entrenar, en la noche…' },
  { icono: '🔥', titulo: 'Protege tu racha', texto: 'Si aún no has registrado nada, te recordamos que tu fueguito te espera.' },
  { icono: '⭐', titulo: 'Sube de nivel más rápido', texto: 'Te avisamos cuántos puntos te faltan para el siguiente nivel.' },
];

// "FitFat Premium" (extra, not in Figma). Demo version: it is activated for free.
export default function PantallaPremium() {
  const [premium, setPremium] = useState<Premium | null>(null);
  const [horas, setHoras] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarPremium()
      .then((p) => {
        setPremium(p);
        setHoras(p.horas);
      })
      .catch((e) => avisar('No se pudo cargar', e instanceof Error ? e.message : 'Inténtalo de nuevo.'));
  }, []);

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/alertas'));

  const guardar = async (activo: boolean, nuevasHoras = horas) => {
    setGuardando(true);
    try {
      if (activo) await pedirPermisoNavegador();
      const r = await guardarPremium(activo, nuevasHoras);
      setPremium(r);
      setHoras(r.horas);
      await programarRecordatorios(await cargarConfig()); // phone: schedule the Premium messages too
      await recargarAvisos(); // browser
      return true;
    } catch (e) {
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const activar = async () => {
    if (await guardar(true, horas.length ? horas : ['08:00', '13:00', '19:00'])) dispararAviso('premium', 'ahora', true);
  };

  const cancelar = () =>
    avisar(
      'Premium cancelado',
      'Ya no recibirás tus mensajes motivacionales. Puedes volver a activarlo cuando quieras: tu fueguito te seguirá esperando. 🔥',
    );

  const alternarHora = (h: string) => {
    if (horas.includes(h)) setHoras(horas.filter((x) => x !== h));
    else if (horas.length < MAX_HORAS) setHoras([...horas, h].sort());
    else avisar('Máximo 4 horarios', 'Quita uno para poder elegir otro.');
  };

  if (!premium) {
    return (
      <Pantalla estiloContenido={styles.contenido}>
        <Cabecera titulo="FitFat Premium" alVolver={volver} />
        <ActivityIndicator color={DORADO} style={{ marginTop: 120 }} />
      </Pantalla>
    );
  }

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="FitFat Premium" alVolver={volver} />

      <LinearGradient colors={['#3A2E0B', '#161616']} style={styles.heroe}>
        <View style={styles.corona}>
          <Text style={{ fontSize: 38 }}>👑</Text>
        </View>
        <Text style={styles.tituloHeroe}>
          {premium.activo ? '¡Eres Premium!' : 'Lleva tu motivación al siguiente nivel'}
        </Text>
        <Text style={styles.subHeroe}>
          {premium.activo
            ? `Recibes ${premium.horas.length} ${premium.horas.length === 1 ? 'mensaje' : 'mensajes'} motivacionales al día.`
            : 'Mensajes que te hablan a ti, en el momento justo, para que no sueltes tu racha.'}
        </Text>
      </LinearGradient>

      {!premium.activo && (
        <View style={{ gap: 10, marginTop: 18 }}>
          {BENEFICIOS.map((b) => (
            <View key={b.titulo} style={styles.beneficio}>
              <Text style={{ fontSize: 22 }}>{b.icono}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.tituloBeneficio}>{b.titulo}</Text>
                <Text style={styles.textoBeneficio}>{b.texto}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.etiqueta}>Horarios de tus mensajes (máx. {MAX_HORAS})</Text>
      <View style={styles.horas}>
        {premium.opciones.map((h) => {
          const activo = horas.includes(h);
          return (
            <Pressable
              key={h}
              onPress={() => alternarHora(h)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activo }}
              style={[styles.hora, activo && styles.horaActiva]}>
              <Text style={[styles.textoHora, activo && { color: '#000' }]}>{horaBonita(h)}</Text>
            </Pressable>
          );
        })}
      </View>

      {premium.activo ? (
        <>
          <Boton
            texto={guardando ? 'Guardando…' : 'Guardar horarios'}
            onPress={() => guardar(true)}
            deshabilitado={guardando || horas.length === 0}
            estilo={{ marginTop: 24 }}
          />
          <Pressable
            onPress={() => dispararAviso('premium', 'ahora', true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ahora, pressed && { opacity: 0.8 }]}>
            <Text style={styles.textoAhora}>💬  Recibir un mensaje ahora</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              if (await guardar(false)) cancelar();
            }}
            accessibilityRole="button"
            hitSlop={8}
            style={{ alignSelf: 'center', marginTop: 18 }}>
            <Text style={styles.cancelar}>Cancelar Premium</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.plan}>
            <Text style={styles.precio}>Gratis</Text>
            <Text style={styles.textoPlan}>en esta versión de demostración · sin tarjeta, sin pagos</Text>
          </View>
          <Pressable
            onPress={activar}
            disabled={guardando}
            accessibilityRole="button"
            style={({ pressed }) => [styles.activar, (pressed || guardando) && { opacity: 0.85 }]}>
            <Text style={styles.textoActivar}>{guardando ? 'Activando…' : '👑  Activar Premium'}</Text>
          </Pressable>
        </>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  heroe: {
    marginTop: 20,
    borderRadius: Radios.tarjeta + 4,
    borderWidth: 1.5,
    borderColor: DORADO,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  corona: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2A2208',
    borderWidth: 2,
    borderColor: DORADO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloHeroe: { fontFamily: Fuentes.extraBold, fontSize: 22, color: Colores.texto, textAlign: 'center', marginTop: 14 },
  subHeroe: { fontFamily: Fuentes.regular, fontSize: 14, lineHeight: 20, color: Colores.textoClaro, textAlign: 'center', marginTop: 6 },
  beneficio: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
  },
  tituloBeneficio: { fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto },
  textoBeneficio: { fontFamily: Fuentes.regular, fontSize: 13, lineHeight: 18, color: Colores.textoSecundario, marginTop: 2 },
  etiqueta: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginTop: 22, marginBottom: 10, marginLeft: 4 },
  horas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hora: {
    width: '23%',
    height: 40,
    borderRadius: 20,
    backgroundColor: Colores.campo,
    borderWidth: 1,
    borderColor: '#4A4A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horaActiva: { backgroundColor: DORADO, borderColor: DORADO },
  textoHora: { fontFamily: Fuentes.etiqueta, fontSize: 12, color: Colores.texto },
  plan: { alignItems: 'center', marginTop: 24 },
  precio: { fontFamily: Fuentes.extraBold, fontSize: 30, color: DORADO },
  textoPlan: { fontFamily: Fuentes.regular, fontSize: 12, color: Colores.textoSecundario, marginTop: 2, textAlign: 'center' },
  activar: {
    marginTop: 14,
    height: 52,
    borderRadius: Radios.boton,
    backgroundColor: DORADO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoActivar: { fontFamily: Fuentes.etiqueta, fontSize: 19, color: '#000' },
  ahora: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DORADO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoAhora: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: DORADO },
  cancelar: { fontFamily: Fuentes.medium, fontSize: 13, color: Colores.textoApagado, textDecorationLine: 'underline' },
});
