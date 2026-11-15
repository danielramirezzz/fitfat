// Starting data ("seeds") of the catalogs. On every start, db.js inserts whatever is
// missing into the tables alimentos, grupos_musculares, ejercicios and logros.
// After that the DATABASE is the source of truth (you can add rows with any SQLite tool).

// Common foods with a typical portion. `categoria` picks the icon in the app.
export const ALIMENTOS = [
  ['Arroz blanco', '1 taza', 'cereal'],
  ['Arroz integral', '1 taza', 'cereal'],
  ['Arepa de maíz', '1 unidad', 'cereal'],
  ['Pan integral', '2 tajadas', 'cereal'],
  ['Pan blanco', '2 tajadas', 'cereal'],
  ['Avena en hojuelas', '1/2 taza', 'cereal'],
  ['Pasta', '1 taza', 'cereal'],
  ['Papa cocida', '1 mediana', 'cereal'],
  ['Plátano maduro', '1/2 unidad', 'cereal'],
  ['Yuca cocida', '1 porción', 'cereal'],
  ['Granola', '1/2 taza', 'cereal'],
  ['Pechuga de pollo', '150 g', 'proteina'],
  ['Carne de res', '120 g', 'proteina'],
  ['Carne de cerdo', '120 g', 'proteina'],
  ['Pescado (tilapia)', '150 g', 'proteina'],
  ['Atún en agua', '1 lata', 'proteina'],
  ['Huevo', '2 unidades', 'proteina'],
  ['Fríjoles', '1 taza', 'proteina'],
  ['Lentejas', '1 taza', 'proteina'],
  ['Garbanzos', '1 taza', 'proteina'],
  ['Queso campesino', '1 tajada', 'proteina'],
  ['Yogur natural', '1 vaso', 'proteina'],
  ['Leche', '1 vaso', 'proteina'],
  ['Maní', '1 puñado', 'proteina'],
  ['Almendras', '1 puñado', 'proteina'],
  ['Ensalada verde', '1 porción', 'verdura'],
  ['Brócoli', '1 taza', 'verdura'],
  ['Zanahoria', '1 unidad', 'verdura'],
  ['Tomate', '1 unidad', 'verdura'],
  ['Espinaca', '1 taza', 'verdura'],
  ['Aguacate', '1/2 unidad', 'verdura'],
  ['Pepino', '1/2 unidad', 'verdura'],
  ['Ahuyama', '1 porción', 'verdura'],
  ['Banano', '1 unidad', 'fruta'],
  ['Manzana', '1 unidad', 'fruta'],
  ['Pera', '1 unidad', 'fruta'],
  ['Fresas', '1 taza', 'fruta'],
  ['Mango', '1 unidad', 'fruta'],
  ['Papaya', '1 taza', 'fruta'],
  ['Piña', '1 taza', 'fruta'],
  ['Naranja', '1 unidad', 'fruta'],
  ['Mandarina', '2 unidades', 'fruta'],
  ['Guayaba', '1 unidad', 'fruta'],
  ['Jugo natural', '1 vaso', 'fruta'],
  ['Café', '1 taza', 'otro'],
  ['Chocolate caliente', '1 taza', 'otro'],
  ['Galletas', '3 unidades', 'otro'],
  ['Empanada', '1 unidad', 'otro'],
  ['Gaseosa', '1 vaso', 'otro'],
].map(([nombre, porcion, categoria]) => ({ nombre, porcion, categoria }));

// Muscle groups and their 4 exercises (bodyweight, beginner).
export const GRUPOS = {
  pecho: {
    nombre: 'Pecho',
    ejercicios: [
      { nombre: 'Flexiones de pecho', reps: 12, detalle: 'Manos al ancho de los hombros' },
      { nombre: 'Flexiones inclinadas', reps: 12, detalle: 'Manos sobre una silla o banco' },
      { nombre: 'Flexiones abiertas', reps: 10, detalle: 'Manos más separadas que los hombros' },
      { nombre: 'Plancha con toque de hombro', segundos: 30, detalle: 'Cadera quieta, alterna las manos' },
    ],
  },
  espalda: {
    nombre: 'Espalda',
    ejercicios: [
      { nombre: 'Superman', reps: 15, detalle: 'Boca abajo, sube brazos y piernas' },
      { nombre: 'Remo invertido en mesa', reps: 10, detalle: 'Bajo una mesa firme, jala el pecho' },
      { nombre: 'Ángeles en el piso', reps: 12, detalle: 'Boca abajo, brazos en forma de Y a W' },
      { nombre: 'Plancha lateral con giro', segundos: 30, detalle: 'De lado sobre un brazo, gira y sube el otro al techo' },
    ],
  },
  piernas: {
    nombre: 'Piernas',
    ejercicios: [
      { nombre: 'Sentadilla con peso corporal', reps: 12, detalle: 'Espalda recta, rodillas afuera' },
      { nombre: 'Zancadas alternas', reps: 10, detalle: 'Rodilla trasera casi al piso' },
      { nombre: 'Puente de glúteos', reps: 15, detalle: 'Aprieta glúteos arriba' },
      { nombre: 'Sentadilla isométrica', segundos: 30, detalle: 'Espalda contra la pared' },
    ],
  },
  brazos: {
    nombre: 'Brazos',
    ejercicios: [
      { nombre: 'Fondos en silla', reps: 12, detalle: 'Codos hacia atrás' },
      { nombre: 'Flexiones diamante', reps: 8, detalle: 'Manos juntas bajo el pecho' },
      { nombre: 'Curl con mochila', reps: 12, detalle: 'Mochila con libros, codos pegados' },
      { nombre: 'Plancha a flexión', reps: 10, detalle: 'De antebrazos a manos y regresa' },
    ],
  },
  hombros: {
    nombre: 'Hombros',
    ejercicios: [
      { nombre: 'Flexiones pica', reps: 10, detalle: 'Cadera arriba en forma de V invertida' },
      { nombre: 'Círculos de brazos', segundos: 30, detalle: 'Brazos estirados a los lados' },
      { nombre: 'Elevaciones laterales con botellas', reps: 12, detalle: 'Sube hasta la altura de los hombros' },
      { nombre: 'Caminata de oso', segundos: 30, detalle: 'Rodillas cerca del piso' },
    ],
  },
  abdomen: {
    nombre: 'Abdomen',
    ejercicios: [
      { nombre: 'Crunch abdominal', reps: 15, detalle: 'Sube con el abdomen, no con el cuello' },
      { nombre: 'Plancha', segundos: 30, detalle: 'Cuerpo recto de cabeza a talones' },
      { nombre: 'Escaladores', segundos: 30, detalle: 'Rodillas al pecho, ritmo constante' },
      { nombre: 'Elevación de piernas', reps: 12, detalle: 'Espalda baja pegada al piso' },
    ],
  },
};

// The 12 achievements. The rule that unlocks each one is in progreso.js (calcularLogros).
export const LOGROS = [
  ['primer-paso', 'Primer paso', 'Creaste tu cuenta', 'rutina'],
  ['racha-3', 'Racha 3 días', '3 días seguidos activo', 'racha'],
  ['racha-7', 'Racha 7 días', '7 días seguidos activo', 'racha'],
  ['racha-30', 'Racha 30 días', '30 días seguidos activo', 'racha'],
  ['rutina-1', 'Primera rutina', 'Completaste tu primera rutina', 'rutina'],
  ['rutina-10', '10 rutinas', 'Completaste 10 rutinas', 'rutina'],
  ['rutina-50', '50 rutinas', 'Completaste 50 rutinas', 'rutina'],
  ['hidratado', 'Hidratado', '8 vasos de agua en un día', 'agua'],
  ['descanso', 'Buen descanso', 'Dormiste 8 horas', 'agua'],
  ['comida-1', 'Buen provecho', 'Registraste tu primera comida', 'agua'],
  ['dia-completo', 'Día completo', 'Registraste las 4 comidas de un día', 'agua'],
  ['nivel-5', 'Nivel 5', 'Llegaste a 2.000 puntos', 'rutina'],
].map(([clave, nombre, descripcion, tipo]) => ({ clave, nombre, descripcion, tipo }));
