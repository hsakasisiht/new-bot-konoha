module.exports = {
  apps: [
    {
      name: 'konoha-bot',
      script: 'pm2-start.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PRODUCTION: 'false',
        VERBOSE_LOGGING: 'true'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PRODUCTION: 'true',
        VERBOSE_LOGGING: 'false',
        DISPLAY: ':99',
        CHROME_BIN: '/usr/bin/google-chrome-stable',
        PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PRODUCTION: 'true',
        VERBOSE_LOGGING: 'false'
      },
      
      // Logging configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/konoha-bot-error.log',
      out_file: './logs/konoha-bot-out.log',
      log_file: './logs/konoha-bot-combined.log',
      merge_logs: true,
      log_type: 'json',
      
      // Restart configuration
      max_restarts: 15,
      min_uptime: '10s',
      restart_delay: 5000,
      autorestart: true,
      
      // Advanced PM2 features
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      wait_ready: false,
      combine_logs: true,
      time: true,
      
      // Cron restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
      
      // Advanced restart conditions
      exp_backoff_restart_delay: 100,
      max_memory_restart: '500M',
      
      // Node.js specific options
      node_args: [
        '--max-old-space-size=512',
        '--optimize-for-size'
      ],
      
      // PM2+ monitoring (if using PM2 Plus)
      pmx: true,
      
      // Instance variables for monitoring
      instance_var: 'INSTANCE_ID'
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/hsakasisiht/new-bot-konoha.git',
      path: '/home/ubuntu/konoha-bot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install nodejs npm -y'
    }
  }
};