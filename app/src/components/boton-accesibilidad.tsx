import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import { Text } from "@/components/texto";
import { Colores, Fuentes, Radios } from "@/constants/theme";
import {
  Accesibilidad,
  cambiarAccesibilidad,
  callar,
  useAccesibilidad,
} from "@/lib/accesibilidad";

// Lucide "accessibility" icon.
export function IconoAccesibilidad({
  color = Colores.fondo,
  tam = 24,
}: {
  color?: string;
  tam?: number;
}) {
  return (
    <Svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={16} cy={4} r={1} />
      <Path d="m18 19 1-7-6 1" />
      <Path d="m5 8 3-3 5.5 3-2.36 3.5" />
      <Path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
      <Path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
    </Svg>
  );
}

const TAMANOS: {
  valor: Accesibilidad["escala"];
  texto: string;
  muestra: number;
}[] = [
  { valor: 1, texto: "Normal", muestra: 14 },
  { valor: 1.15, texto: "Grande", muestra: 17 },
  { valor: 1.3, texto: "Muy grande", muestra: 20 },
];

function Interruptor({
  titulo,
  detalle,
  valor,
  alCambiar,
}: {
  titulo: string;
  detalle: string;
  valor: boolean;
  alCambiar: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => alCambiar(!valor)}
      accessibilityRole="switch"
      accessibilityState={{ checked: valor }}
      style={styles.opcion}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.opcionTitulo}>{titulo}</Text>
        <Text style={styles.opcionDetalle}>{detalle}</Text>
      </View>
      <Switch
        value={valor}
        onValueChange={alCambiar}
        trackColor={{ false: Colores.borde, true: Colores.verde }}
        thumbColor="#FFFFFF"
        {...{ activeThumbColor: "#FFFFFF" }}
      />
    </Pressable>
  );
}

// Round green accessibility button + its settings panel.
// Floating above the tab bar (barra-navegacion.tsx) and at the top of Login.
export function BotonAccesibilidad({
  estilo,
  tam = 48,
}: {
  estilo?: ViewStyle;
  tam?: number;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel="Opciones de accesibilidad"
        hitSlop={6}
        style={[
          styles.boton,
          { width: tam, height: tam, borderRadius: tam / 2 },
          estilo,
        ]}
      >
        <IconoAccesibilidad tam={tam / 2} />
      </Pressable>
      <PanelAccesibilidad
        visible={abierto}
        alCerrar={() => setAbierto(false)}
      />
    </>
  );
}

// Settings panel (also opened from Ajustes → Accesibilidad).
export function PanelAccesibilidad({
  visible,
  alCerrar,
}: {
  visible: boolean;
  alCerrar: () => void;
}) {
  const prefs = useAccesibilidad();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => alCerrar()}
    >
      <Pressable
        style={styles.velo}
        onPress={() => alCerrar()}
        accessibilityLabel="Cerrar"
      >
        <Pressable
          style={[styles.panel, { paddingBottom: insets.bottom + 20 }]}
          onPress={() => {}}
        >
          <View style={styles.cabecera}>
            <View style={styles.iconoPanel}>
              <IconoAccesibilidad tam={22} />
            </View>
            <Text style={styles.titulo} accessibilityRole="header">
              Accesibilidad
            </Text>
          </View>

          <Text style={styles.seccion}>Tamaño del texto</Text>
          <View style={styles.tamanos}>
            {TAMANOS.map((t) => {
              const activo = prefs.escala === t.valor;
              return (
                <Pressable
                  key={t.valor}
                  onPress={() => cambiarAccesibilidad({ escala: t.valor })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                  style={[styles.tamano, activo && styles.tamanoActivo]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.letra,
                      { fontSize: t.muestra },
                      activo && { color: Colores.fondo },
                    ]}
                  >
                    Aa
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.tamanoTexto,
                      activo && { color: Colores.fondo },
                    ]}
                  >
                    {t.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Interruptor
            titulo="Alto contraste"
            detalle="Textos grises más claros y fáciles de leer."
            valor={prefs.contraste}
            alCambiar={(v) => cambiarAccesibilidad({ contraste: v })}
          />
          <Interruptor
            titulo="Guía por voz en rutinas"
            detalle="FitFat te dice en voz alta cada ejercicio y cada descanso."
            valor={prefs.voz}
            alCambiar={(v) => {
              cambiarAccesibilidad({ voz: v });
              if (!v) callar();
            }}
          />

          <Pressable
            onPress={() => alCerrar()}
            accessibilityRole="button"
            style={styles.listo}
          >
            <Text style={styles.listoTexto}>Listo</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: Colores.verde,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  velo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: Colores.fondo2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconoPanel: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colores.verde,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontFamily: Fuentes.extraBold, fontSize: 22, color: Colores.texto },
  seccion: {
    fontFamily: Fuentes.etiqueta,
    fontSize: 15,
    color: Colores.textoSecundario,
    marginTop: 22,
    marginBottom: 10,
  },
  tamanos: { flexDirection: "row", gap: 10 },
  tamano: {
    flex: 1,
    height: 78,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.tarjeta,
    borderWidth: 1,
    borderColor: Colores.borde,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tamanoActivo: { backgroundColor: Colores.verde, borderColor: Colores.verde },
  letra: { fontFamily: Fuentes.extraBold, color: Colores.texto },
  tamanoTexto: {
    fontFamily: Fuentes.etiqueta,
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 14,
    borderRadius: Radios.tarjeta,
    backgroundColor: Colores.tarjeta,
  },
  opcionTitulo: {
    fontFamily: Fuentes.bold,
    fontSize: 15,
    color: Colores.texto,
  },
  opcionDetalle: {
    fontFamily: Fuentes.regular,
    fontSize: 12,
    color: Colores.textoSecundario,
    marginTop: 3,
  },
  listo: {
    marginTop: 20,
    height: 52,
    borderRadius: Radios.boton,
    backgroundColor: Colores.verde,
    alignItems: "center",
    justifyContent: "center",
  },
  listoTexto: {
    fontFamily: Fuentes.etiqueta,
    fontSize: 18,
    color: Colores.fondo,
  },
});
