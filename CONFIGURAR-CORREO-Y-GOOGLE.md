# Activar el correo real y Google real en FitFat

FitFat ya tiene todo el código listo. Solo faltan **dos claves** que tienes que crear tú con tu cuenta de Google
(nadie más puede hacerlo por ti). Mientras no las pongas, la app sigue en "modo demostración" y nada se rompe.

Las dos claves van en un archivo llamado **`.env`** dentro de la carpeta `server/`:

1. En la carpeta `FitFat/server/` copia el archivo `.env.example` y renombra la copia a `.env`.
2. Ábrelo con el Bloc de notas y llena los valores (pasos de abajo).
3. Reinicia el servidor (en su terminal: `Ctrl + C` y luego `npm run dev`).

> ⚠️ El archivo `.env` tiene claves secretas. No lo compartas ni lo subas a GitHub (ya está en `.gitignore`).

---

## 1. Correo real (código para recuperar la contraseña)

Usamos una cuenta de Gmail para enviar los correos. Recomendado: crea un Gmail solo para FitFat
(por ejemplo `fitfat.app.ibague@gmail.com`), así no usas tu correo personal.

1. Entra a esa cuenta de Gmail y activa la **verificación en dos pasos**:
   https://myaccount.google.com/signinoptions/twosv
2. Crea una **contraseña de aplicación**: https://myaccount.google.com/apppasswords
   - Nombre de la app: `FitFat`.
   - Google te muestra 16 letras (ej. `abcd efgh ijkl mnop`). Cópialas.
3. En `server/.env` escribe:
   ```
   SMTP_USER=fitfat.app.ibague@gmail.com
   SMTP_PASS=abcdefghijklmnop
   ```
   (las 16 letras, sin espacios). **No es la contraseña normal del Gmail.**
4. Reinicia el servidor.

**Cómo probarlo:** en la app, "¿Olvidaste tu contraseña?" → escribe el correo de una cuenta → te llega un correo
con el código y el recuadro verde de "Modo demostración" ya no aparece.

Importante: el código solo puede llegar a cuentas que **tengan correo guardado**. Ahora "Crear usuario" tiene el
campo "Correo (opcional)", y las cuentas que ya existen lo pueden agregar en Perfil → Editar perfil.

---

## 2. Continuar con Google (real)

1. Entra a https://console.cloud.google.com/ con tu cuenta de Google.
2. Arriba, "Seleccionar proyecto" → **Proyecto nuevo** → nombre `FitFat` → Crear.
3. Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth** (o "Google Auth Platform"):
   - Tipo de usuario: **Externo**.
   - Nombre de la app: `FitFat`, correo de asistencia: el tuyo. Guardar.
   - En **Público / Usuarios de prueba** agrega los correos de Gmail que van a probar (el tuyo, los de Cristopher
     y Juan Pablo, y los de quien vaya a probar en clase). Mientras la app esté "en prueba", solo esos correos
     pueden entrar.
4. **Credenciales** (o "Clientes") → **Crear credenciales** → **ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **Orígenes de JavaScript autorizados**: agrega `http://localhost:8081`
   - (No hace falta llenar "URI de redireccionamiento".)
   - Crear. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).
5. En `server/.env` escribe:
   ```
   GOOGLE_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
   ```
6. Reinicia el servidor.

**Cómo probarlo:** en el PC abre http://localhost:8081 → "Continuar con Google". Ahora aparece el botón oficial
de Google, que abre su propia ventana para elegir tu cuenta.

### ⚠️ Google y el celular

Google **solo acepta** páginas en `http://localhost` o en direcciones **https** con un nombre de dominio.
No acepta `http://10.30.1.102:8081` (la IP del PC en el Wi-Fi). Por eso:

- **En el PC** (http://localhost:8081) funciona en cuanto pongas la clave.
- **En el celular** hace falta que FitFat tenga una dirección https. Hay dos caminos:
  1. **Publicar FitFat en internet** (recomendado, también sirve para que tus compañeros la usen sin estar en tu
     Wi-Fi). Luego agregas esa dirección https en "Orígenes de JavaScript autorizados".
  2. Un túnel temporal (ej. `npx cloudflared tunnel --url http://localhost:8081`), que da una dirección https
     distinta cada vez; habría que agregarla en Google cada vez.
- En **Expo Go** (la app instalada), Google no funciona sin una versión instalada propia de FitFat, así que allí se
  muestra un aviso. En Safari / Chrome del celular sí funciona (con https).
