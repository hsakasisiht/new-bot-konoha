# 🍃 Konoha Bot - PM2 Deployment Guide

## 📋 Quick Start with PM2

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Start Bot with PM2
```bash
# Production mode
npm run pm2:start

# Development mode  
npm run pm2:dev

# Or use the management script
chmod +x pm2.sh
./pm2.sh prod
```

### 3. Manage the Bot
```bash
# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart bot
npm run pm2:restart

# Stop bot
npm run pm2:stop
```

## 🔧 PM2 Commands Reference

### Basic Process Management
```bash
# Start in different environments
./pm2.sh start production
./pm2.sh start development
./pm2.sh start staging

# Process control
./pm2.sh stop          # Stop bot
./pm2.sh restart       # Restart bot
./pm2.sh reload         # Zero-downtime reload
./pm2.sh status         # Show status
```

### Monitoring & Logs
```bash
# View logs
./pm2.sh logs          # Last 50 lines
./pm2.sh logs 100      # Last 100 lines

# Real-time monitoring
./pm2.sh monitor       # Opens PM2 monitor
pm2 monit              # Alternative monitor
```

### Advanced Features
```bash
# Setup auto-start on boot
./pm2.sh setup
pm2 save

# Save current configuration
./pm2.sh save
```

## 📊 PM2 Features for Konoha Bot

### ✅ Process Management
- **Auto-restart**: Automatically restarts on crashes
- **Memory limits**: Restarts if memory usage > 500MB
- **Max restarts**: Limited to 15 restart attempts
- **Graceful restart**: Zero-downtime reloads

### ✅ Logging System
- **Structured logs**: JSON format with timestamps
- **Separate files**: Error, output, and combined logs
- **Log rotation**: Automatic log file management
- **Real-time**: Live log streaming

### ✅ Environment Management
- **Production mode**: Optimized for servers
- **Development mode**: Verbose logging for debugging
- **Staging mode**: Testing environment
- **Environment variables**: Automatic Chrome/Linux setup

### ✅ Monitoring
- **Real-time metrics**: CPU, memory, uptime
- **Process status**: Running, stopped, errored states
- **Restart history**: Track restart events
- **Performance monitoring**: Built-in PM2 metrics

## 🐧 Linux Server Deployment

### Complete Setup Script
```bash
# 1. Clone repository
git clone https://github.com/hsakasisiht/new-bot-konoha.git
cd new-bot-konoha

# 2. Install dependencies  
npm install

# 3. Setup Chrome dependencies
chmod +x setup-linux.sh
./setup-linux.sh

# 4. Configure environment
cp .env.template .env
# Edit .env with your settings

# 5. Start with PM2
chmod +x pm2.sh
./pm2.sh setup
./pm2.sh prod

# 6. Save PM2 configuration
./pm2.sh save
```

### Auto-start on Boot
```bash
# Generate startup script
pm2 startup

# Follow the generated command, then:
pm2 save
```

## 📈 Production Optimizations

### Environment Configuration
```javascript
// ecosystem.config.js optimizations
{
  max_memory_restart: '500M',      // Restart if memory > 500MB
  min_uptime: '10s',               // Minimum uptime before restart
  max_restarts: 15,                // Maximum restart attempts
  restart_delay: 5000,             // 5s delay between restarts
  cron_restart: '0 3 * * *',       // Daily restart at 3 AM
  node_args: [                     // Node.js optimizations
    '--max-old-space-size=512',
    '--optimize-for-size'
  ]
}
```

### Log Management
```bash
# PM2 log rotation (install if needed)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## 🔍 Troubleshooting

### Common Issues
```bash
# Bot not starting
./pm2.sh logs          # Check error logs
pm2 describe konoha-bot # Detailed status

# Permission issues
chmod +x pm2.sh
sudo chown -R $USER:$USER .

# Chrome dependencies (Linux)
./setup-linux.sh       # Install Chrome deps
```

### Health Checks
```bash
# Process status
pm2 list

# Detailed info
pm2 show konoha-bot

# Resource usage
pm2 monit
```

## 🚀 Deployment Strategies

### Blue-Green Deployment
```bash
# Start new instance
pm2 start ecosystem.config.js --name konoha-bot-blue

# Test new instance, then:
pm2 stop konoha-bot
pm2 start konoha-bot-blue
pm2 delete konoha-bot
pm2 restart konoha-bot-blue --name konoha-bot
```

### Rolling Updates
```bash
# Zero-downtime reload
pm2 reload konoha-bot

# Or restart with new environment
pm2 restart konoha-bot --env production
```

---
**🍃 PM2 + Konoha Bot = Production Ready WhatsApp Automation**