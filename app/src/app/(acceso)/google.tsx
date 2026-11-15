import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { BotonGoogleOficial } from "@/components/boton-google";
import { IconoUsuario } from "@/components/iconos-acceso";
import { Pantalla } from "@/components/pantalla";
import { Text } from "@/components/texto";
import { Boton, CampoTexto } from "@/components/ui";
import { Colores, Fuentes } from "@/constants/theme";
import { avisar } from "@/lib/avisos";
import {
  cargarConfigServidor,
  CuentaGoogle,
  cuentasRecordadas,
  guardarCredencial,
} from "@/lib/google";

const img = {
  volverCirculo: require("@/assets/figma/google/volver-circulo.svg"),
  volverFlecha: require("@/assets/figma/google/volver-flecha.svg"),
  avatarVerde: require("@/assets/figma/google/avatar-verde.svg"),
  avatarMorado: require("@/assets/figma/google/avatar-morado.svg"),
  flechaVerde: require("@/assets/figma/google/flecha-verde.svg"),
  flechaGris: require("@/assets/figma/google/flecha-gris.svg"),
  punteado: require("@/assets/figma/google/circulo-punteado.svg"),
  mas: require("@/assets/figma/google/mas.svg"),
  consejo: require("@/assets/figma/google/consejo.svg"),
  rayo: require("@/assets/figma/google/rayo.svg"),
  correo: require("@/assets/figma/recuperar/correo.svg"),
};

const volver = () =>
  router.canGoBack() ? router.back() : router.replace("/login");

function entrar(c: CuentaGoogle) {
  router.push({
    pathname: "/validar-google",
    params: { nombre: c.nombre, correo: c.correo },
  });
}

function entrarReal(credencial: string) {
  guardarCredencial(credencial);
  router.push({ pathname: "/validar-google", params: { modo: "real" } });
}

// "Pantalla seleccionar cuenta Google". Real mode (server has GOOGLE_CLIENT_ID): Google's
// official button, which opens Google's own account chooser. Demo mode: see lib/google.ts.
export default function SeleccionarCuentaGoogle() {
  const [cuentas, setCuentas] = useState<CuentaGoogle[]>([]);
  const [formulario, setFormulario] = useState(false);
  const [clientId, setClientId] = useState<string | null | undefined>(
    undefined,
  ); // undefined = loading

  useEffect(() => {
    cuentasRecordadas().then(setCuentas);
    cargarConfigServidor()
      .then((c) => setClientId(c.googleClientId))
      .catch(() => setClientId(null));
  }, []);
  const real = !!clientId;

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Pressable
        onPress={volver}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={styles.volver}
      >
        <Image source={img.volverCirculo} style={StyleSheet.absoluteFill} />
        <Image
          source={img.volverFlecha}
          style={{ width: 10.4, height: 18.4 }}
        />
      </Pressable>

      <Text style={styles.titulo} accessibilityRole="header">
        Elige una{"\n"}cuenta
      </Text>
      <Text style={styles.sub}>para continuar en FitFat con Google</Text>

      {real ? (
        <View style={{ marginTop: 34 }}>
          <BotonGoogleOficial clientId={clientId} alEntrar={entrarReal} />
        </View>
      ) : clientId === null ? (
        <View style={{ gap: 12, marginTop: 34 }}>
          {cuentas.map((c, i) => {
            const primera = i === 0;
            return (
              <Pressable
                key={c.correo}
                onPress={() => entrar(c)}
                accessibilityRole="button"
                accessibilityLabel={`Continuar como ${c.nombre}, ${c.correo}`}
                style={({ pressed }) => [
                  styles.cuenta,
                  primera && styles.cuentaActiva,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={styles.avatar}>
                  <Image
                    source={primera ? img.avatarVerde : img.avatarMorado}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text
                    style={[styles.inicial, primera && { color: "#000000" }]}
                  >
                    {c.nombre[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={styles.nombre} numberOfLines={1}>
                    {c.nombre}
                  </Text>
                  <Text style={styles.correo} numberOfLines={1}>
                    {c.correo}
                  </Text>
                </View>
                <Image
                  source={primera ? img.flechaVerde : img.flechaGris}
                  style={{ width: 10.4, height: 18.4, marginRight: 22 }}
                />
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setFormulario(true)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.cuenta,
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.avatar}>
              <Image
                source={img.punteado}
                style={{ position: "absolute", width: 47, height: 47 }}
              />
              <Image source={img.mas} style={{ width: 20.4, height: 20.4 }} />
            </View>
            <Text style={[styles.nombre, { marginLeft: 14 }]}>
              Usar otra cuenta
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ height: 120 }} />
      )}

      <View style={styles.consejo}>
        <Image source={img.consejo} style={StyleSheet.absoluteFill} />
        <Image source={img.rayo} style={{ width: 13, height: 20 }} />
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.consejoTitulo}>Entra en un solo toque</Text>
          <Text style={styles.consejoTexto}>Sin contraseñas que recordar.</Text>
        </View>
      </View>

      {clientId === null && (
        <Text style={styles.demo}>
          Modo demostración: todavía no se conecta con Google de verdad. Tu
          nombre y correo solo se usan para crear tu cuenta de FitFat.
        </Text>
      )}

      <Text style={styles.pie}>
        Google compartirá tu nombre, correo y foto de perfil con FitFat.{" "}
        <Text
          style={{ color: Colores.verde }}
          onPress={() =>
            avisar(
              "Política de privacidad",
              "FitFat solo usa tu nombre y correo para crear tu cuenta. No los compartimos con nadie y puedes cambiarlos en Editar perfil.",
            )
          }
        >
          Política de privacidad
        </Text>
      </Text>

      <FormularioCuenta
        visible={formulario}
        alCerrar={() => setFormulario(false)}
      />
    </Pantalla>
  );
}

// "Usar otra cuenta": name + Gmail (what Google would give us).
function FormularioCuenta({
  visible,
  alCerrar,
}: {
  visible: boolean;
  alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [errores, setErrores] = useState<{ nombre?: string; correo?: string }>(
    {},
  );

  const continuar = () => {
    const e: typeof errores = {};
    if (nombre.trim().length < 3) e.nombre = "Escribe tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim()))
      e.correo = "Escribe un correo válido.";
    setErrores(e);
    if (Object.keys(e).length) return;
    alCerrar();
    entrar({ nombre: nombre.trim(), correo: correo.trim().toLowerCase() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={alCerrar}
    >
      <Pressable
        style={styles.velo}
        onPress={alCerrar}
        accessibilityLabel="Cerrar"
      >
        <Pressable style={styles.panel} onPress={() => {}}>
          <Text style={styles.panelTitulo}>Usar otra cuenta</Text>
          <View style={{ gap: 12, marginTop: 16 }}>
            <CampoTexto
              etiqueta="Nombre"
              icono={<IconoUsuario />}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre y apellido"
              autoComplete="name"
              error={errores.nombre}
            />
            <CampoTexto
              etiqueta="Correo de Google"
              icono={
                <Image
                  source={img.correo}
                  style={{ width: 17, height: 13.67 }}
                />
              }
              value={correo}
              onChangeText={setCorreo}
              placeholder="tucorreo@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              onSubmitEditing={continuar}
              error={errores.correo}
            />
          </View>
          <Boton
            texto="Continuar"
            onPress={continuar}
            estilo={{ marginTop: 22 }}
          />
          <Boton
            texto="Cancelar"
            variante="gris"
            onPress={alCerrar}
            estilo={{ marginTop: 10 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 22, paddingHorizontal: 20 },
  volver: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  titulo: {
    fontFamily: Fuentes.bold,
    fontSize: 34,
    lineHeight: 40,
    color: Colores.texto,
    marginTop: 28,
    marginLeft: 4,
  },
  sub: {
    fontFamily: Fuentes.regular,
    fontSize: 16,
    color: Colores.textoClaro,
    marginTop: 8,
    marginLeft: 4,
  },
  // Account card (same values as the Figma vector: #1A1A1A, radius 18, gray or green border)
  cuenta: {
    height: 77,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    borderRadius: 18,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  cuentaActiva: { borderWidth: 1.5, borderColor: Colores.verde },
  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  inicial: { fontFamily: Fuentes.bold, fontSize: 19, color: Colores.texto },
  nombre: { fontFamily: Fuentes.bold, fontSize: 16, color: Colores.texto },
  correo: {
    fontFamily: Fuentes.regular,
    fontSize: 13,
    color: Colores.textoSecundario,
    marginTop: 3,
  },
  consejo: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    marginTop: 30,
  },
  consejoTitulo: {
    fontFamily: Fuentes.bold,
    fontSize: 14,
    color: Colores.verde,
  },
  consejoTexto: {
    fontFamily: Fuentes.regular,
    fontSize: 13,
    color: Colores.textoClaro,
    marginTop: 2,
  },
  demo: {
    fontFamily: Fuentes.regular,
    fontSize: 12,
    lineHeight: 17,
    color: Colores.textoApagado,
    marginTop: 14,
    marginHorizontal: 4,
  },
  pie: {
    fontFamily: Fuentes.regular,
    fontSize: 12,
    lineHeight: 18,
    color: "#A8A8A8",
    textAlign: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  velo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: Colores.fondo2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colores.bordeTarjeta,
    padding: 20,
    paddingBottom: 30,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  panelTitulo: {
    fontFamily: Fuentes.extraBold,
    fontSize: 22,
    color: Colores.texto,
  },
});
