module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "npm",
      args: "run production",
      watch: ["./"],
      ignore_watch: ["node_modules", ".next", "out"],
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
