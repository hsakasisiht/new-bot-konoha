#!/bin/bash

# 🍃 Konoha Bot - Linux Startup Script with Error Handling
# This script starts the bot with proper error recovery and monitoring

echo "🍃 Starting Konoha WhatsApp Bot on Linux..."
echo "=========================================="

# Function to check if bot is still running
check_bot_status() {
    if pgrep -f "node src/bot.js" > /dev/null; then
        return 0  # Bot is running
    else
        return 1  # Bot is not running
    fi
}

# Function to start the bot
start_bot() {
    echo "🚀 Starting bot..."
    
    # Set environment variables for better Linux compatibility
    export DISPLAY=${DISPLAY:-:99}
    export CHROME_BIN=${CHROME_BIN:-/usr/bin/google-chrome-stable}
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    # Start virtual display if needed (for headless servers)
    if ! pgrep Xvfb > /dev/null; then
        echo "🖥️ Starting virtual display..."
        Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
        sleep 2
    fi
    
    # Start the bot with error recovery
    while true; do
        echo "📱 Launching WhatsApp bot..."
        node src/bot.js
        
        # Check exit code
        exit_code=$?
        echo "⚠️ Bot exited with code: $exit_code"
        
        if [ $exit_code -eq 0 ]; then
            echo "✅ Bot shut down gracefully"
            break
        elif [ $exit_code -eq 1 ]; then
            echo "❌ Bot crashed, attempting restart in 10 seconds..."
            sleep 10
        else
            echo "💥 Bot encountered fatal error, restarting in 30 seconds..."
            sleep 30
        fi
    done
}

# Function to stop the bot
stop_bot() {
    echo "🛑 Stopping bot..."
    pkill -f "node src/bot.js"
    pkill -f "Xvfb :99"
    echo "✅ Bot stopped"
}

# Handle script arguments
case "$1" in
    start)
        start_bot
        ;;
    stop)
        stop_bot
        ;;
    restart)
        stop_bot
        sleep 3
        start_bot
        ;;
    status)
        if check_bot_status; then
            echo "✅ Bot is running"
        else
            echo "❌ Bot is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        echo ""
        echo "🍃 Konoha Bot Management Script"
        echo "Commands:"
        echo "  start   - Start the bot with error recovery"
        echo "  stop    - Stop the bot gracefully"
        echo "  restart - Restart the bot"
        echo "  status  - Check if bot is running"
        exit 1
        ;;
esac