// PM2 cluster configuration for the Nuxt (Nitro) SSR server.
// The output is stateless, so clustering is straightforward: workers share the
// same port via Node's cluster module and Traefik/Dokploy see one container.
module.exports = {
  apps: [
    {
      name: 'market-front',
      script: '.output/server/index.mjs',
      exec_mode: 'cluster',
      // Default to 2 SSR workers. Raise only together with the container memory
      // limit configured in Dokploy.
      instances: process.env.PM2_INSTANCES
        ? Number(process.env.PM2_INSTANCES)
        : 2,
      node_args: '--max-old-space-size=384',
      max_memory_restart: '450M',
      kill_timeout: 8000,
      env: {
        HOST: process.env.HOST || '0.0.0.0',
        PORT: process.env.PORT || '3000',
      },
    },
  ],
};
