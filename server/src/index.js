import { networkInterfaces } from 'node:os';

import { app } from './app.js';

const PUERTO = Number(process.env.PORT ?? 3000);

// 0.0.0.0 = listen on every network card, so the phone on the same Wi-Fi can reach it.
app.listen(PUERTO, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  console.log(`FitFat API escuchando en el puerto ${PUERTO}`);
  console.log(`  En este PC:   http://localhost:${PUERTO}/api/salud`);
  for (const ip of ips) console.log(`  En la red:    http://${ip}:${PUERTO}/api/salud`);
});
