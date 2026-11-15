// Deploy build (Render runs "npm run build"):
// 1. installs the server and app dependencies,
// 2. builds the web version of the app into app/dist (served by the Express server).
import { execSync } from 'node:child_process';

const correr = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, FITFAT_WEB_OUTPUT: 'single' } });

correr('npm ci', 'server');
correr('npm ci', 'app');
correr('npx expo export -p web', 'app');
console.log('\nListo: app/dist tiene la versión web de FitFat.');
