import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Pantalla } from '@/components/pantalla';
import { Cabecera } from '@/components/perfil';
import { EncabezadoRecuperar, estilosRecuperar, PasosRecuperar } from '@/components/recuperar';
import { Text } from '@/components/texto';
import { Boton, CampoTexto } from '@/components/ui';
import { ErrorApi } from '@/lib/api';
import { pedirCodigo } from '@/lib/recuperar';

const img = {
  circulo: require('@/assets/figma/recuperar/circulo.svg'),
  candado: require('@/assets/figma/recuperar/candado.svg'),
  correo: require('@/assets/figma/recuperar/correo.svg'),
};

const irALogin = () => (router.canGoBack() ? router.back() : router.replace('/login'));

// "Pantalla recuperar contraseña" (step 1 of 3).
export default function Recuperar() {
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!correo.trim()) return setError('Escribe el correo de tu cuenta.');
    setError('');
    setEnviando(true);
    try {
      await pedirCodigo(correo.trim());
      router.push('/verificar-codigo');
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo enviar el código.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Pantalla estiloContenido={styles.contenido}>
      <Cabecera titulo="Recuperar contraseña" alVolver={irALogin} />
      <PasosRecuperar paso={1} />

      <EncabezadoRecuperar
        circulo={<Image source={img.circulo} style={StyleSheet.absoluteFill} />}
        icono={<Image source={img.candado} style={{ width: 33, height: 41.8 }} />}
        titulo="¿Olvidaste tu contraseña?">
        <Text style={estilosRecuperar.explicacion}>
          No te preocupes. Escribe el correo de tu cuenta y te enviaremos un código.
        </Text>
      </EncabezadoRecuperar>

      <View style={{ marginTop: 26 }}>
        <CampoTexto
          etiqueta="Correo electrónico"
          icono={<Image source={img.correo} style={{ width: 17, height: 13.67 }} />}
          value={correo}
          onChangeText={setCorreo}
          placeholder="usuario@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={enviar}
          error={error}
        />
        <Text style={styles.nota}>También puedes escribir tu nombre de usuario.</Text>
      </View>

      <Boton
        texto={enviando ? 'Enviando…' : 'Enviar código'}
        onPress={enviar}
        deshabilitado={enviando}
        estilo={{ marginTop: 34 }}
      />
      <View style={estilosRecuperar.enlace}>
        <Text style={estilosRecuperar.enlaceGris}>¿La recordaste? </Text>
        <Pressable onPress={irALogin} accessibilityRole="link" hitSlop={8}>
          <Text style={estilosRecuperar.enlaceVerde}>Inicia sesión</Text>
        </Pressable>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingTop: 16 },
  nota: { fontFamily: 'Montserrat_400Regular', fontSize: 12, color: '#8F8F8F', marginTop: 6, marginLeft: 4 },
});
