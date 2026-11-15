import { ComponentRef, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components/texto';
import { Colores, Fuentes } from '@/constants/theme';

// Google Identity Services (the official "Continuar con Google" button) for the web.
// Google draws the button and its own account chooser; we only receive the ID token.

type Google = {
  accounts: {
    id: {
      initialize: (o: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void;
      renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
    };
  };
};

let cargaScript: Promise<Google> | null = null;
function cargarGoogle(): Promise<Google> {
  cargaScript ??= new Promise((resolver, rechazar) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolver((window as unknown as { google: Google }).google);
    s.onerror = () => {
      cargaScript = null;
      rechazar(new Error('sin conexión'));
    };
    document.head.appendChild(s);
  });
  return cargaScript;
}

export function BotonGoogleOficial({ clientId, alEntrar }: { clientId: string; alEntrar: (credencial: string) => void }) {
  const contenedor = useRef<ComponentRef<typeof View>>(null);
  const [error, setError] = useState('');
  const alEntrarRef = useRef(alEntrar);
  useEffect(() => {
    alEntrarRef.current = alEntrar;
  });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let vivo = true;
    cargarGoogle()
      .then((google) => {
        const el = contenedor.current as unknown as HTMLElement | null;
        if (!vivo || !el) return;
        google.accounts.id.initialize({ client_id: clientId, callback: (r) => alEntrarRef.current(r.credential) });
        google.accounts.id.renderButton(el, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          locale: 'es',
          width: Math.min(360, el.clientWidth || 360),
        });
      })
      .catch(() => vivo && setError('No se pudo cargar Google. Revisa tu conexión a internet.'));
    return () => {
      vivo = false;
    };
  }, [clientId]);

  if (Platform.OS !== 'web') {
    return (
      <Text style={styles.aviso}>
        En Expo Go, Google necesita una versión instalada de FitFat. Para entrar con Google abre FitFat desde el
        navegador del celular.
      </Text>
    );
  }
  return (
    <View>
      <View ref={contenedor} style={styles.boton} />
      {error ? <Text style={styles.aviso}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  boton: { minHeight: 44, alignItems: 'center' },
  aviso: { fontFamily: Fuentes.regular, fontSize: 13, lineHeight: 19, color: Colores.textoClaro, marginTop: 8 },
});
