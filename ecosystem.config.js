module.exports = {
  apps : [
    {
      name: "Options-Bear&Bull-api",
      script: "./app.js",
      error_file: 'pm2logs/err.log',
      out_file: 'pm2logs/out.log',
      time: true,
      watch: true,
      ignore_watch : ["Keystore", "Keystore/*", "node_modules", "pm2logs/err.log", "pm2logs/out.log", "pm2logs/combined.log", "public"],
      env: {
        "NODE_ENV": "development"
      },
      env_local: {
        "NODE_ENV": "local"
      },
      env_production: {
        "NODE_ENV": "production",
      },
      env_staging: {
        "NODE_ENV": "staging",
      }
    }
  ]
}