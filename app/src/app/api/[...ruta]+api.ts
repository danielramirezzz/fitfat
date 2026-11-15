// Bridge: forwards every request to /api/... on the Expo server (port 8081)
// to the FitFat backend on this same PC (port 3000).
// Why: some networks (or the Windows Firewall) block port 3000 from the phone,
// while 8081 already works because the app itself is loaded through it.

const BACKEND = process.env.FITFAT_BACKEND ?? 'http://localhost:3000';

async function puente(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cabeceras: Record<string, string> = {};
  for (const nombre of ['content-type', 'authorization']) {
    const valor = req.headers.get(nombre);
    if (valor) cabeceras[nombre] = valor;
  }
  try {
    const r = await fetch(BACKEND + url.pathname + url.search, {
      method: req.method,
      headers: cabeceras,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.text(),
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({ error: 'El servidor de FitFat no está encendido en el PC.' }, { status: 502 });
  }
}

export const GET = puente;
export const POST = puente;
export const PUT = puente;
export const DELETE = puente;
