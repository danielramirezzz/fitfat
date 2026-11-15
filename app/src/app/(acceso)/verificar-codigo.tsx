import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { EncabezadoRecuperar, estilosRecuperar, PasosRecuperar } from '@/components/recuperar';
import { Text } from '@/components/texto';
import { Boton } from '@/components/ui';
import { Colores, Fuentes } from '@/constants/theme';
import { ErrorApi } from '@/lib/api';
import { obtenerFlujo, pedirCodigo, verificarCodigo } from '@/lib/recuperar';

const img = {
  circulo: require('@/assets/figma/recuperar/circulo.svg'),
  sobre: require('@/assets/figma/recuperar/sobre.svg'),
  casilla: require('@/assets/figma/recuperar/casilla.svg'),
};

const ESPERA = 45; // seconds before "Reenviar"

// "Pantalla verificar código" (step 2 of 3).
export default function VerificarCodigo() {
  const flujo = obtenerFlujo();
  if (!flujo) return <Redirect href="/recuperar" />; // e.g. after reloading the page
  return <Formulario destino={flujo.destino} codigoDemo={flujo.codigoDemo} correo={flujo.correo} />;
}

function Formulario({ destino, codigoDemo, correo }: { destino: string; codigoDemo?: string; correo: string }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [demo, setDemo] = useState(codigoDemo);
  const [hasta, setHasta] = useState(() => Date.now() + ESPERA * 1000);
  const [ahora, setAhora] = useState(() => Date.now());
  const entrada = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const faltan = Math.max(0, Math.ceil((hasta - ahora) / 1000));

  const verificar = async (valor = codigo) => {
    if (valor.length < 4) return setError('Escribe los 4 dígitos.');
    setError('');
    setVerificando(true);
    try {
      await verificarCodigo(valor);
      router.replace('/nueva-contrasena');
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo verificar el código.');
      setCodigo('');
    } finally {
      setVerificando(false);
    }
  };

  const escribir = (t: string) => {
    const limpio = t.replace(/\D/g, '').slice(0, 4);
    setCodigo(limpio);
    if (limpio.length === 4) verificar(limpio); // check as soon as the 4th digit is typed
  };

  const reenviar = async () => {
    try {
      const f = await pedirCodigo(correo);
      setDemo(f.codigoDemo);
      setHasta(Date.now() + ESPERA * 1000);
      setCodigo('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo reenviar el código.');
    }
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Verificar código" alVolver={() => router.back()} />
      <PasosRecuperar paso={2} />

      <EncabezadoRecuperar
        circulo={<Image source={img.circulo} style={StyleSheet.absoluteFill} />}
        icono={<Image source={img.sobre} style={{ width: 41.8, height: 33 }} />}
        titulo="Revisa tu correo">
        <Text style={estilosRecuperar.explicacion}>Enviamos un código de 4 dígitos a</Text>
        <Text style={styles.destino}>{destino}</Text>
      </EncabezadoRecuperar>

      {/* 4 boxes drawn over one hidden input (so paste and the number keyboard work) */}
      <Pressable onPress={() => entrada.current?.focus()} style={styles.casillas} accessibilityLabel="Código de 4 dígitos">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.casilla, i > codigo.length && { opacity: 0.45 }]}>
            <Image source={img.casilla} style={StyleSheet.absoluteFill} />
            <Text style={styles.digito}>{codigo[i] ?? ''}</Text>
          </View>
        ))}
        <TextInput
          ref={entrada}
          value={codigo}
          onChangeText={escribir}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={4}
          autoFocus
          style={styles.oculto}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {demo ? (
        <View style={styles.demo}>
          <Text style={styles.demoTexto}>
            Modo demostración (sin servicio de correo): tu código es <Text style={styles.demoCodigo}>{demo}</Text>
          </Text>
        </View>
      ) : null}

      <Boton
        texto={verificando ? 'Verificando…' : 'Verificar'}
        onPress={() => verificar()}
        deshabilitado={verificando}
        estilo={{ marginTop: 30 }}
      />
      <View style={estilosRecuperar.enlace}>
        <Text style={estilosRecuperar.enlaceGris}>¿No te llegó? </Text>
        {faltan > 0 ? (
          <Text style={estilosRecuperar.enlaceVerde}>Reenviar en 0:{String(faltan).padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={reenviar} accessibilityRole="button" hitSlop={8}>
            <Text style={estilosRecuperar.enlaceVerde}>Reenviar código</Text>
          </Pressable>
        )}
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  destino: { fontFamily: Fuentes.bold, fontSize: 14, color: Colores.texto, textAlign: 'center', marginTop: 2 },
  casillas: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 26 },
  casilla: { width: 66, height: 74, alignItems: 'center', justifyContent: 'center' },
  digito: { fontFamily: Fuentes.bold, fontSize: 30, color: Colores.texto },
  oculto: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  error: { fontFamily: Fuentes.medium, fontSize: 13, color: Colores.rojo, textAlign: 'center', marginTop: 10 },
  demo: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colores.verde,
    backgroundColor: '#14241A',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  demoTexto: { fontFamily: Fuentes.regular, fontSize: 13, color: Colores.textoClaro, textAlign: 'center' },
  demoCodigo: { fontFamily: Fuentes.extraBold, fontSize: 15, color: Colores.verde, letterSpacing: 2 },
});
