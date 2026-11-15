// Dynamic config on top of app.json.
// FITFAT_WEB_OUTPUT=single → plain web app (index.html + JS) for the deploy build:
// in production our own Express server (server/) serves it together with /api.
// In development we keep "server" so the /api bridge in src/app/api works on port 8081.
module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, output: process.env.FITFAT_WEB_OUTPUT ?? config.web.output },
});
