import nodemailer from 'nodemailer';

// Real e-mails (recovery codes). Configured in server/.env:
//   SMTP_USER=tucorreo@gmail.com
//   SMTP_PASS=la contraseña de aplicación de 16 letras (NO tu contraseña normal)
// Optional: SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465), SMTP_FROM.
// Without SMTP_USER/SMTP_PASS the server stays in demo mode (the app shows the code).

export const correoConfigurado = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporte = null;
// Tests use a fake transport (nothing is sent).
export function usarTransporte(t) {
  transporte = t;
}
function obtenerTransporte() {
  if (!transporte) {
    const puerto = Number(process.env.SMTP_PORT ?? 465);
    transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: puerto,
      secure: puerto === 465, // 465 = TLS from the start; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporte;
}

export async function enviarCodigo(destino, codigo, nombre) {
  const saludo = nombre ? `Hola, ${nombre.split(' ')[0]}` : 'Hola';
  return obtenerTransporte().sendMail({
    from: process.env.SMTP_FROM ?? `FitFat <${process.env.SMTP_USER}>`,
    to: destino,
    subject: `${codigo} es tu código de FitFat`,
    text: `${saludo}:\n\nTu código para recuperar la contraseña de FitFat es ${codigo}.\nVence en 10 minutos.\n\nSi no lo pediste, ignora este correo: tu cuenta sigue segura.\n\n— FitFat · Tú eres tu único rival`,
    html: `<div style="font-family:Arial,sans-serif;background:#0D0D0D;color:#fff;padding:32px;border-radius:16px;max-width:420px">
      <h2 style="margin:0 0 8px">${saludo} 👋</h2>
      <p style="color:#C4C4C4">Tu código para recuperar la contraseña de <b>FitFat</b> es:</p>
      <p style="font-size:36px;font-weight:800;letter-spacing:10px;color:#1EFF3C;margin:16px 0">${codigo}</p>
      <p style="color:#C4C4C4">Vence en 10 minutos. Si no lo pediste, ignora este correo: tu cuenta sigue segura.</p>
      <p style="color:#6F6F6F;font-size:12px;margin-top:24px">FitFat · Tú eres tu único rival 🔥</p>
    </div>`,
  });
}
