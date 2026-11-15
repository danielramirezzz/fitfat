import { db } from './db.js';
import { calcularRacha, fechaLocal } from './racha.js';
import { nivelDe } from './rutinas.js';

// Text of each reminder and of the Premium motivational messages, personalized
// with the person's name, streak, level and goal (persuasive technology: it
// speaks to *you* and reminds you what you could lose).

export const HORAS_PREMIUM = ['07:00', '08:00', '10:00', '13:00', '16:00', '19:00', '20:00', '21:00'];

const azar = (lista) => lista[Math.floor(Math.random() * lista.length)];

function contexto(usuario) {
  const nombre = usuario.nombre?.split(' ')[0] ?? usuario.usuario;
  const { dias, hoyActivo } = calcularRacha(usuario.id);
  const { nivel, siguiente } = nivelDe(usuario.puntos);
  return { nombre, dias, hoyActivo, nivel, faltan: siguiente - usuario.puntos, objetivo: usuario.objetivo ?? 'tu meta' };
}

// Reminders chosen in Alertas (one per type).
export function textoRecordatorio(usuario, tipo) {
  const c = contexto(usuario);
  const racha = c.dias > 0 ? `Llevas ${c.dias} ${c.dias === 1 ? 'día' : 'días'} de racha. ` : '';
  const textos = {
    entrenamiento: [`¡Hora de entrenar, ${c.nombre}! 🔥`, `${racha}Una rutina de 15 minutos y tu fueguito sigue encendido.`],
    agua: [`Hora de tomar agua, ${c.nombre} 💧`, 'Un vaso ahora te acerca a tu meta de 8 vasos.'],
    comidas: [`Registra tus comidas 🍎`, `${racha}Solo toma 1 minuto y suma +20 puntos.`],
    dormir: [`Hora de descansar, ${c.nombre} 🌙`, 'Dormir 8 horas también es entrenar. Mañana rindes más.'],
    pesaje: ['Pesaje semanal ⚖️', 'Registra tu peso en Progreso para ver cuánto has avanzado.'],
    motivacion: [`Tú eres tu único rival, ${c.nombre} 💪`, `${racha}Cada día cuenta. ¡Hoy también!`],
  };
  const [titulo, cuerpo] = textos[tipo] ?? textos.motivacion;
  return { titulo, cuerpo };
}

// FitFat Premium: a different motivational message each time.
export function mensajePremium(usuario) {
  const c = contexto(usuario);
  const opciones = [
    [`${c.nombre}, tu fueguito cuenta contigo 🔥`, c.dias > 0 ? `Llevas ${c.dias} ${c.dias === 1 ? 'día' : 'días'} seguidos. No dejes que se apague hoy.` : 'Hoy es el día perfecto para encenderlo otra vez.'],
    [`Estás a ${c.faltan} puntos del nivel ${c.nivel + 1} ⭐`, 'Una rutina rápida te da +50. ¿La hacemos ahora?'],
    [`${c.nombre}, ${c.objetivo.toLowerCase()} se logra un día a la vez 💪`, 'No tiene que ser perfecto, solo tiene que ser hoy.'],
    ['El cansancio pasa, el orgullo se queda 🏆', `Hazlo por el ${c.nombre} de dentro de un mes.`],
    [`Pequeños pasos, grandes cambios, ${c.nombre} 🚶`, '15 minutos de movimiento valen más que 0.'],
    ['Tu cuerpo te lo va a agradecer 💚', 'Toma agua, muévete un poco y registra tu día en FitFat.'],
    [c.hoyActivo ? `¡Ya cumpliste hoy, ${c.nombre}! 🎉` : `Todavía estás a tiempo, ${c.nombre} ⏰`, c.hoyActivo ? 'Mañana vuelve por más: tu racha sigue creciendo.' : 'Registra algo hoy y tu racha sigue viva.'],
    ['Tú eres tu único rival 🥇', 'Compite contra el tú de ayer, no contra los demás.'],
  ];
  const [titulo, cuerpo] = azar(opciones);
  return { titulo, cuerpo };
}

// --- Premium settings --------------------------------------------------------------------------

export function leerPremium(usuario) {
  let horas = [];
  try {
    horas = JSON.parse(usuario.premium_horas ?? '[]');
  } catch {
    horas = [];
  }
  return { activo: Boolean(usuario.premium), horas, opciones: HORAS_PREMIUM };
}

// Validates and saves. Returns the error message, or '' if OK.
export function guardarPremium(usuarioId, b) {
  const horas = Array.isArray(b?.horas) ? [...new Set(b.horas)].sort() : null;
  if (!horas || !horas.every((h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h))) return 'Horario inválido.';
  if (horas.length > 4) return 'Elige hasta 4 horarios.';
  const activo = b.activo ? 1 : 0;
  db.prepare(
    `UPDATE usuarios SET premium = ?, premium_horas = ?,
       premium_desde = CASE WHEN ? = 1 AND premium_desde IS NULL THEN ? ELSE premium_desde END WHERE id = ?`,
  ).run(activo, JSON.stringify(horas), activo, fechaLocal(), usuarioId);
  return '';
}
