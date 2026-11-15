import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconoAccesibilidad, PanelAccesibilidad } from '@/components/boton-accesibilidad';
import { Pantalla } from '@/components/pantalla';
import { BotonCerrarSesion, Cabecera, ModalCerrarSesion } from '@/components/perfil';
import { Text } from '@/components/texto';
import { Colores, Fuentes, Radios } from '@/constants/theme';
import { cambiarAccesibilidad, useAccesibilidad } from '@/lib/accesibilidad';
import { cargarConfig, ConfigAlertas, guardarConfig, programarRecordatorios } from '@/lib/alertas';
import { avisar } from '@/lib/avisos';

const img = {
  campana: require('@/assets/figma/perfil/aj-campana.svg'),
  sonido: require('@/assets/figma/perfil/aj-sonido.svg'),
  luna: require('@/assets/figma/perfil/aj-luna.svg'),
  regla: require('@/assets/figma/perfil/aj-regla.svg'),
  mundo: require('@/assets/figma/perfil/aj-mundo.svg'),
  candado: require('@/assets/figma/perfil/aj-candado.svg'),
  escudo: require('@/assets/figma/perfil/aj-escudo.svg'),
  ayuda: require('@/assets/figma/perfil/aj-ayuda.svg'),
  flecha: require('@/assets/figma/perfil/flecha.svg'),
  on: require('@/assets/figma/perfil/switch-on.svg'),
  off: require('@/assets/figma/perfil/switch-off.svg'),
};

type FilaProps = {
  icono: ReactNode;
  titulo: string;
  valor?: string; // gray text on the right
  interruptor?: boolean; // shows the Figma switch instead of the arrow
  onPress: () => void;
  ultima?: boolean;
};

function Fila({ icono, titulo, valor, interruptor, onPress, ultima }: FilaProps) {
  const esInterruptor = interruptor !== undefined;
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole={esInterruptor ? 'switch' : 'button'}
        accessibilityState={esInterruptor ? { checked: interruptor } : undefined}
        accessibilityLabel={valor ? `${titulo}: ${valor}` : titulo}
        style={({ pressed }) => [styles.fila, pressed && { backgroundColor: '#1D1D1D' }]}>
        <View style={styles.icono}>{icono}</View>
        <Text style={styles.titulo}>{titulo}</Text>
        {valor ? <Text style={styles.valor}>{valor}</Text> : null}
        {esInterruptor ? (
          <Image source={interruptor ? img.on : img.off} style={{ width: 48, height: 28 }} />
        ) : (
          <Image source={img.flecha} style={{ width: 7.2, height: 12.2, marginLeft: 10 }} />
        )}
      </Pressable>
      {!ultima && <View style={styles.separador} />}
    </>
  );
}

// "Pantalla ajustes"
export default function Ajustes() {
  const prefs = useAccesibilidad();
  const [alertas, setAlertas] = useState<ConfigAlertas | null>(null);
  const [confirmarSalida, setConfirmarSalida] = useState(false);
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    cargarConfig()
      .then(setAlertas)
      .catch(() => {});
  }, []);

  // Push notifications = the "Push" channel of Alertas (same setting).
  const cambiarPush = async () => {
    if (!alertas) return;
    const nueva = { ...alertas, push: !alertas.push };
    setAlertas(nueva);
    try {
      const { config } = await guardarConfig(nueva);
      setAlertas(config);
      await programarRecordatorios(config);
    } catch (e) {
      setAlertas(alertas);
      avisar('No se pudo guardar', e instanceof Error ? e.message : 'Inténtalo de nuevo.');
    }
  };

  const volver = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Ajustes" alVolver={volver} />

      <Text style={styles.seccion}>Preferencias</Text>
      <View style={styles.tarjeta}>
        <Fila
          icono={<Image source={img.campana} style={{ width: 18, height: 18 }} />}
          titulo="Notificaciones push"
          interruptor={alertas?.push ?? false}
          onPress={cambiarPush}
        />
        <Fila
          icono={<Image source={img.sonido} style={{ width: 16.35, height: 16 }} />}
          titulo="Sonidos y vibración"
          interruptor={prefs.sonidos}
          onPress={() => cambiarAccesibilidad({ sonidos: !prefs.sonidos })}
        />
        <Fila
          icono={<Image source={img.luna} style={{ width: 17.36, height: 17.36 }} />}
          titulo="Modo oscuro"
          interruptor
          onPress={() =>
            avisar('Modo oscuro', 'FitFat está diseñada en modo oscuro: cansa menos la vista y ahorra batería. El modo claro llegará pronto.')
          }
          ultima
        />
      </View>

      <Text style={styles.seccion}>General</Text>
      <View style={styles.tarjeta}>
        <Fila
          icono={<Image source={img.regla} style={{ width: 20, height: 10 }} />}
          titulo="Unidades"
          valor="kg · cm"
          onPress={() => avisar('Unidades', 'FitFat usa kilogramos y centímetros. Pronto podrás cambiar a libras y pulgadas.')}
        />
        <Fila
          icono={<Image source={img.mundo} style={{ width: 20, height: 20 }} />}
          titulo="Idioma"
          valor="Español"
          onPress={() => avisar('Idioma', 'Por ahora FitFat está disponible en español.')}
        />
        {/* Not in Figma: same panel as the floating accessibility button. */}
        <Fila
          icono={<IconoAccesibilidad color={Colores.texto} tam={20} />}
          titulo="Accesibilidad"
          valor={prefs.escala > 1 || prefs.contraste || prefs.voz ? 'Activada' : undefined}
          onPress={() => setPanel(true)}
          ultima
        />
      </View>

      <Text style={styles.seccion}>Cuenta</Text>
      <View style={styles.tarjeta}>
        <Fila
          icono={<Image source={img.candado} style={{ width: 16, height: 20 }} />}
          titulo="Cambiar contraseña"
          onPress={() => router.push('/cambiar-contrasena')}
        />
        <Fila
          icono={<Image source={img.escudo} style={{ width: 18, height: 20 }} />}
          titulo="Privacidad y datos"
          onPress={() =>
            avisar(
              'Privacidad y datos',
              'Tus datos se guardan en el servidor de FitFat y solo tú puedes verlos con tu sesión. Tu contraseña se guarda cifrada (nadie puede leerla) y tu foto de perfil se queda en este dispositivo.',
            )
          }
        />
        <Fila
          icono={<Image source={img.ayuda} style={{ width: 20, height: 20 }} />}
          titulo="Ayuda y soporte"
          onPress={() =>
            avisar(
              'Ayuda y soporte',
              '¿Algo no funciona? Revisa que el celular y el PC estén en el mismo Wi-Fi y que el servidor esté encendido. Si sigue fallando, escríbele al equipo de FitFat.',
            )
          }
          ultima
        />
      </View>

      <View style={{ marginTop: 30 }}>
        <BotonCerrarSesion onPress={() => setConfirmarSalida(true)} />
      </View>
      <Text style={styles.version}>FitFat v1.0</Text>

      <PanelAccesibilidad visible={panel} alCerrar={() => setPanel(false)} />
      <ModalCerrarSesion visible={confirmarSalida} alCancelar={() => setConfirmarSalida(false)} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  seccion: { fontFamily: Fuentes.etiqueta, fontSize: 16, color: Colores.texto, marginTop: 22, marginBottom: 8 },
  tarjeta: {
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.fondo2,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    overflow: 'hidden',
  },
  fila: { height: 54, flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 16 },
  icono: { width: 22, alignItems: 'center' },
  titulo: { flex: 1, fontFamily: Fuentes.bold, fontSize: 15, color: Colores.texto, marginLeft: 14 },
  valor: { fontFamily: Fuentes.regular, fontSize: 14, color: Colores.textoSecundario },
  separador: { height: 1, backgroundColor: '#262626', marginHorizontal: 16 },
  version: { fontFamily: Fuentes.regular, fontSize: 12, color: '#6F6F6F', textAlign: 'center', marginTop: 16 },
});
