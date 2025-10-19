#!/bin/bash

# 🍃 Konoha Bot - PM2 Management Script
# Professional process management with PM2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="konoha-bot"
CONFIG_FILE="ecosystem.config.js"

# Functions
print_header() {
    echo -e "${GREEN}🍃 Konoha Bot - PM2 Manager${NC}"
    echo -e "${BLUE}================================${NC}"
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 is not installed${NC}"
        echo -e "${YELLOW}Installing PM2 globally...${NC}"
        npm install -g pm2
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ PM2 installed successfully${NC}"
        else
            echo -e "${RED}❌ Failed to install PM2${NC}"
            exit 1
        fi
    fi
}

create_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        echo -e "${GREEN}📁 Created logs directory${NC}"
    fi
}

start_bot() {
    local env=${1:-production}
    
    echo -e "${BLUE}🚀 Starting $APP_NAME in $env mode...${NC}"
    
    create_logs_dir
    
    # Stop existing instance if running
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start with specified environment
    pm2 start $CONFIG_FILE --env $env
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $APP_NAME started successfully${NC}"
        pm2 show $APP_NAME
    else
        echo -e "${RED}❌ Failed to start $APP_NAME${NC}"
        exit 1
    fi
}

stop_bot() {
    echo -e "${YELLOW}🛑 Stopping $APP_NAME...${NC}"
    pm2 stop $APP_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $APP_NAME stopped${NC}"
    else
        echo -e "${YELLOW}⚠️ $APP_NAME was not running${NC}"
    fi
}

restart_bot() {
    local env=${1:-production}
    
    echo -e "${BLUE}🔄 Restarting $APP_NAME...${NC}"
    pm2 restart $APP_NAME --env $env
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $APP_NAME restarted${NC}"
    else
        echo -e "${RED}❌ Failed to restart $APP_NAME${NC}"
    fi
}

reload_bot() {
    echo -e "${BLUE}🔄 Reloading $APP_NAME (zero-downtime)...${NC}"
    pm2 reload $APP_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $APP_NAME reloaded${NC}"
    else
        echo -e "${RED}❌ Failed to reload $APP_NAME${NC}"
    fi
}

status_bot() {
    echo -e "${BLUE}📊 $APP_NAME Status:${NC}"
    pm2 show $APP_NAME
    echo ""
    echo -e "${BLUE}📋 All PM2 Processes:${NC}"
    pm2 list
}

logs_bot() {
    local lines=${1:-50}
    echo -e "${BLUE}📜 Showing last $lines lines of logs...${NC}"
    pm2 logs $APP_NAME --lines $lines
}

monitor_bot() {
    echo -e "${BLUE}📊 Opening PM2 Monitor...${NC}"
    pm2 monit
}

setup_startup() {
    echo -e "${BLUE}⚙️ Setting up PM2 startup script...${NC}"
    
    # Generate startup script
    pm2 startup
    
    echo -e "${YELLOW}📝 After running the above command, save PM2 process list:${NC}"
    echo -e "${GREEN}pm2 save${NC}"
}

backup_config() {
    echo -e "${BLUE}💾 Backing up PM2 configuration...${NC}"
    pm2 save
    echo -e "${GREEN}✅ Configuration saved${NC}"
}

# Main script logic
print_header

case "$1" in
    start)
        check_pm2
        start_bot ${2:-production}
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot ${2:-production}
        ;;
    reload)
        reload_bot
        ;;
    status)
        status_bot
        ;;
    logs)
        logs_bot ${2:-50}
        ;;
    monitor)
        monitor_bot
        ;;
    setup)
        check_pm2
        setup_startup
        ;;
    save)
        backup_config
        ;;
    dev)
        check_pm2
        start_bot development
        ;;
    prod)
        check_pm2
        start_bot production
        ;;
    staging)
        check_pm2
        start_bot staging
        ;;
    *)
        echo -e "${BLUE}Usage: $0 {start|stop|restart|reload|status|logs|monitor|setup|save|dev|prod|staging}${NC}"
        echo ""
        echo -e "${GREEN}🍃 Konoha Bot PM2 Management Commands:${NC}"
        echo -e "  ${YELLOW}start [env]${NC}    - Start bot (default: production)"
        echo -e "  ${YELLOW}stop${NC}           - Stop bot"
        echo -e "  ${YELLOW}restart [env]${NC}  - Restart bot"
        echo -e "  ${YELLOW}reload${NC}         - Zero-downtime reload"
        echo -e "  ${YELLOW}status${NC}         - Show bot status"
        echo -e "  ${YELLOW}logs [lines]${NC}   - Show logs (default: 50 lines)"
        echo -e "  ${YELLOW}monitor${NC}        - Open PM2 monitor"
        echo -e "  ${YELLOW}setup${NC}          - Setup PM2 startup script"
        echo -e "  ${YELLOW}save${NC}           - Save PM2 configuration"
        echo ""
        echo -e "${GREEN}🎯 Quick Commands:${NC}"
        echo -e "  ${YELLOW}dev${NC}            - Start in development mode"
        echo -e "  ${YELLOW}prod${NC}           - Start in production mode"
        echo -e "  ${YELLOW}staging${NC}        - Start in staging mode"
        echo ""
        echo -e "${BLUE}💡 Examples:${NC}"
        echo -e "  $0 start production"
        echo -e "  $0 logs 100"
        echo -e "  $0 restart development"
        exit 1
        ;;
esac