# Publicar FitFat en internet (Render + Turso)

Todo el código ya está listo. Estos son los pasos que necesitan **tus cuentas** (yo no puedo crear cuentas ni
escribir contraseñas o claves secretas).

## 1. Repositorio en GitHub (2 min)
1. Entra a https://github.com/new
2. Nombre: `fitfat` · Visibilidad: **Private** · **No** marques "Add a README" ni nada más.
3. Clic en **Create repository** y avísame: yo subo el código (te puede salir una ventana de GitHub para
   autorizar: inicia sesión ahí).

## 2. Base de datos en Turso (3 min)
1. Entra a https://app.turso.tech y regístrate con **Continue with GitHub**.
2. Crea una base de datos: nombre `fitfat`, ubicación **AWS us-west-2 (Oregón)** (Render también está en Oregón).
3. En la base de datos copia la **URL** (empieza por `libsql://`). Esa me la puedes pasar.
4. Crea un **token** ("Create Token" / "Generate token", sin fecha de vencimiento, permiso de lectura y escritura).
   **El token es secreto: no me lo pases por el chat.** Lo pegarás tú mismo en Render (paso 3).

## 3. Servicio en Render (5 min + ~10 min de construcción)
1. Entra a https://dashboard.render.com y regístrate con **GitHub**.
2. **New → Blueprint** → elige el repositorio `fitfat` (dale permiso a Render para verlo).
3. Render lee `render.yaml` y te pide los valores secretos:
   - `TURSO_DATABASE_URL`: la URL `libsql://...` de Turso.
   - `TURSO_AUTH_TOKEN`: el token de Turso.
   - `SMTP_USER` / `SMTP_PASS`: déjalos vacíos si aún no tienes la contraseña de aplicación de Gmail.
4. **Apply**. La primera construcción tarda ~10 min. Al final verás la dirección, algo como
   `https://fitfat-xxxx.onrender.com`.

## 4. Google con la dirección nueva
En Google Cloud (proyecto `fitfat-514720`, cuenta personal) → Clientes → "Cliente web 1" →
Orígenes autorizados de JavaScript → agregar `https://fitfat-xxxx.onrender.com`. (Esto lo puedo hacer yo con el
navegador si tienes la sesión abierta.)

## Cómo se actualiza después
Cada vez que se suben cambios a GitHub (`git push`), Render vuelve a construir y publicar solo.

## Bueno saber
- Plan gratis: si nadie la usa en 15 min, se "duerme" y la primera visita tarda ~30–50 s. Ábrela 1 minuto antes
  de exponer.
- Los datos viven en Turso: no se pierden cuando Render reinicia.
- En el celular se usa desde el navegador (Safari/Chrome) y se puede "Agregar a pantalla de inicio".
