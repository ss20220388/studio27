// pm2: sve četiri aplikacije dev servera (pm2 startOrReload ecosystem.config.cjs)
// Backend čita server/.env iz svog foldera, a Astro aplikacije PORT/HOST iz env ispod.
const KOREN = process.env.STUDIO27_KOREN || "/srv/studio27";

const astro = (ime, folder, port) => ({
  name: ime,
  cwd: `${KOREN}/${folder}`,
  script: "dist/server/entry.mjs",
  env: { PORT: port, HOST: "127.0.0.1", NODE_ENV: "production" },
  max_memory_restart: "400M",
});

module.exports = {
  apps: [
    {
      name: "api-dev",
      cwd: `${KOREN}/server`,
      script: "java",
      args: "-Xmx1g -jar target/studio27-0.0.1-SNAPSHOT.jar",
      interpreter: "none",
    },
    astro("client-dev", "client", 3000),
    astro("admin-dev", "admin", 4000),
    astro("app-dev", "webapp", 5000),
  ],
};
