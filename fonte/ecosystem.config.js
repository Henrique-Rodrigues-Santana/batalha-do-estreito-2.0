// ============================================================
// PM2 Ecosystem Config -- Batalha do Estreito 2.0
// Uso: pm2 start ecosystem.config.js --env production
// ============================================================

module.exports = {
  apps: [
    {
      name: 'batalha-estreito',
      script: 'server.js',

      // SQLite nao suporta multiplas instancias sem conexao compartilhada
      instances: 1,
      exec_mode: 'fork',

      // Reiniciar automaticamente em crash ou estouro de memoria
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Aguardar 10s antes de marcar como online
      wait_ready: false,
      listen_timeout: 10000,

      // Graceful shutdown (zero-downtime para WebSocket)
      kill_timeout: 5000,

      // Logs estruturados
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Variaveis por ambiente
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
        // ATENCAO: JWT_SECRET, ALLOWED_ORIGINS, ADMIN_USER_IDS ficam no .env
        // Nunca colocar segredos aqui (seria commitado no git)
      }
    }
  ]
};
