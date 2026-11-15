import { db } from './db.js';

// Food search (table alimentos) and the suggested meal plan.

export const COMIDAS = ['desayuno', 'almuerzo', 'cena', 'snack'];
export const PUNTOS_COMIDA = 20;
export const META_AGUA = 8;
export const META_SUENO = 8;



// Search without caring about accents or capitals ("platano" finds "Plátano").
export const normalizar = (t) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Shared foods + the ones this person added. Names that START with the text go first.
export function buscarAlimentos(q, usuarioId = null) {
  const t = normalizar(q ?? '').replace(/[%_\\]/g, '');
  if (!t) return [];
  return db
    .prepare(
      `SELECT nombre, porcion, categoria FROM alimentos
       WHERE busqueda LIKE ? AND (creado_por IS NULL OR creado_por = ?)
       ORDER BY busqueda LIKE ? DESC, creado_por IS NOT NULL DESC, nombre
       LIMIT 6`,
    )
    .all(`%${t}%`, usuarioId, `${t}%`)
    .map((f) => ({ ...f }));
}

// Foods typed by hand ("+" in Registro) are saved as this person's own foods,
// so they show up in their next searches.
export function guardarAlimentosPropios(usuarioId, lista) {
  const existe = db.prepare('SELECT 1 FROM alimentos WHERE busqueda = ? AND (creado_por IS NULL OR creado_por = ?)');
  const insertar = db.prepare(
    'INSERT OR IGNORE INTO alimentos (nombre, porcion, categoria, busqueda, creado_por) VALUES (?, ?, ?, ?, ?)',
  );
  for (const f of lista) {
    const busqueda = normalizar(f.nombre);
    if (busqueda && !existe.get(busqueda, usuarioId)) insertar.run(f.nombre, f.porcion, f.categoria, busqueda, usuarioId);
  }
}

// --- Meal plan ----------------------------------------------------------------

// The 4 moments of the plan. `registro` = the tab of "Registro" that marks it as done.
export const MOMENTOS = [
  { clave: 'desayuno', nombre: 'Desayuno', hora: '7:00 a. m.', hasta: 9.5, registro: 'desayuno' },
  { clave: 'media', nombre: 'Media mañana', hora: '10:00 a. m.', hasta: 12, registro: 'snack' },
  { clave: 'almuerzo', nombre: 'Almuerzo', hora: '12:30 p. m.', hasta: 16, registro: 'almuerzo' },
  { clave: 'cena', nombre: 'Cena', hora: '7:00 p. m.', hasta: 24, registro: 'cena' },
];

// Options per moment and goal. Each day of the week picks a different one.
const MENU = {
  desayuno: {
    comun: [
      ['Avena con fruta y yogur', 'Avena, banano, fresas, yogur natural'],
      ['Huevos pericos con arepa', 'Huevo, tomate, cebolla, arepa de maíz'],
      ['Pan integral con queso y fruta', 'Pan integral, queso campesino, papaya'],
      ['Calentado ligero', 'Fríjoles, arroz, huevo, aguacate'],
      ['Batido de banano y avena', 'Leche, banano, avena, canela'],
      ['Tostadas con aguacate y huevo', 'Pan integral, aguacate, huevo'],
      ['Yogur con granola y frutas', 'Yogur natural, granola, mango'],
    ],
  },
  media: {
    comun: [
      ['Fruta y un puñado de nueces', 'Manzana o pera, maní o almendras'],
      ['Yogur con fresas', 'Yogur natural, fresas'],
      ['Mandarinas y queso', 'Mandarina, queso campesino'],
      ['Palitos de zanahoria y pepino', 'Zanahoria, pepino, limón'],
      ['Banano con maní', 'Banano, mantequilla de maní'],
      ['Papaya con limón', 'Papaya, limón'],
      ['Guayaba y almendras', 'Guayaba, almendras'],
    ],
  },
  almuerzo: {
    'Perder peso': [
      ['Pollo a la plancha con ensalada', 'Pechuga, ensalada verde, 1/2 taza de arroz'],
      ['Pescado al horno con verduras', 'Tilapia, brócoli, zanahoria'],
      ['Lentejas con ensalada', 'Lentejas, tomate, pepino'],
      ['Wrap de pollo y verduras', 'Tortilla integral, pollo, lechuga'],
      ['Sopa de verduras con pollo', 'Ahuyama, pollo, espinaca'],
      ['Atún con ensalada de garbanzos', 'Atún, garbanzos, tomate'],
      ['Carne magra con verduras salteadas', 'Res, brócoli, pimentón'],
    ],
    'Ganar músculo': [
      ['Pollo a la plancha con arroz', 'Pechuga, arroz integral, ensalada'],
      ['Carne de res con papa y ensalada', 'Res, papa cocida, ensalada verde'],
      ['Fríjoles con arroz, huevo y aguacate', 'Fríjoles, arroz, huevo, aguacate'],
      ['Pasta con atún y verduras', 'Pasta, atún, tomate, espinaca'],
      ['Pescado con arroz y plátano', 'Tilapia, arroz, plátano maduro'],
      ['Lentejas con arroz y pollo', 'Lentejas, arroz, pechuga'],
      ['Bandeja ligera', 'Fríjoles, arroz, carne molida, aguacate'],
    ],
    Mantenerme: [
      ['Pollo a la plancha con arroz', 'Pechuga, arroz integral, ensalada'],
      ['Pescado con papa y ensalada', 'Tilapia, papa cocida, ensalada'],
      ['Lentejas con arroz', 'Lentejas, arroz, ensalada'],
      ['Carne con verduras y yuca', 'Res, verduras, yuca cocida'],
      ['Ajiaco ligero', 'Pollo, papa, mazorca, alcaparras'],
      ['Arroz con pollo y ensalada', 'Arroz, pollo, verduras'],
      ['Garbanzos guisados con arroz', 'Garbanzos, arroz, tomate'],
    ],
  },
  cena: {
    'Perder peso': [
      ['Tortilla de huevo con verduras', 'Huevos, espinaca, tomate'],
      ['Ensalada de atún', 'Atún, lechuga, tomate, pepino'],
      ['Crema de ahuyama', 'Ahuyama, cebolla, queso campesino'],
      ['Pollo desmechado con verduras', 'Pollo, pimentón, cebolla'],
      ['Omelette de champiñones', 'Huevos, champiñones, espinaca'],
      ['Pescado a la plancha y ensalada', 'Tilapia, ensalada verde'],
      ['Yogur con fruta', 'Yogur natural, fresas'],
    ],
    'Ganar músculo': [
      ['Tortilla de huevo con verduras', 'Huevos, espinaca, tomate, pan integral'],
      ['Arepa con pollo y queso', 'Arepa, pollo desmechado, queso'],
      ['Pasta integral con pollo', 'Pasta, pollo, tomate'],
      ['Batido de proteína casero', 'Leche, banano, avena, maní'],
      ['Sándwich de atún', 'Pan integral, atún, tomate'],
      ['Huevos con arepa y aguacate', 'Huevos, arepa, aguacate'],
      ['Arroz con huevo y fríjoles', 'Arroz, huevo, fríjoles'],
    ],
    Mantenerme: [
      ['Tortilla de huevo con verduras', 'Huevos, espinaca, tomate, pan integral'],
      ['Arepa con queso y ensalada', 'Arepa, queso campesino, tomate'],
      ['Sopa de pollo', 'Pollo, papa, zanahoria'],
      ['Sándwich integral', 'Pan integral, pollo, lechuga'],
      ['Crema de verduras con pan', 'Ahuyama, zanahoria, pan integral'],
      ['Pescado con ensalada', 'Tilapia, ensalada verde'],
      ['Huevos revueltos con tostadas', 'Huevos, pan integral'],
    ],
  },
};

// Plan for one date: the 4 moments with their suggestion.
export function planDelDia(fecha, objetivo) {
  const [y, m, d] = fecha.split('-').map(Number);
  const diaSemana = new Date(y, m - 1, d).getDay();
  return MOMENTOS.map((mo) => {
    const opciones = MENU[mo.clave][objetivo] ?? MENU[mo.clave].Mantenerme ?? MENU[mo.clave].comun;
    const [plato, detalle] = opciones[diaSemana % opciones.length];
    return { clave: mo.clave, nombre: mo.nombre, hora: mo.hora, hasta: mo.hasta, registro: mo.registro, plato, detalle };
  });
}
