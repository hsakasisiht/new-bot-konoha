#!/bin/bash

# 🍃 Konoha Bot - PM2 Authentication Helper
# Helps with initial authentication setup for PM2 deployment

echo "🍃 Konoha Bot - PM2 Authentication Setup"
echo "========================================"

# Function to check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed. Installing..."
        npm install -g pm2
    fi
}

# Function to setup authentication
setup_auth() {
    echo "📱 Setting up WhatsApp authentication..."
    echo ""
    echo "🔧 Step 1: Start bot in development mode for initial authentication"
    echo "   This allows you to scan QR code or enter pairing code interactively"
    echo ""
    
    read -p "🤔 Do you want to start interactive authentication? (y/n): " answer
    
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "🚀 Starting bot in interactive mode..."
        echo "📱 Scan the QR code or use the pairing code to authenticate"
        echo "⚡ Press Ctrl+C after authentication is complete"
        echo ""
        
        # Start bot in development mode for authentication
        NODE_ENV=development node src/bot.js
        
        echo ""
        echo "✅ Authentication completed!"
        echo "🔄 Now starting with PM2..."
        
        # Start with PM2
        npm run pm2:start
        
        echo ""
        echo "🎉 Bot is now running with PM2!"
        echo "📊 Use 'npm run pm2:status' to check status"
        echo "📜 Use 'npm run pm2:logs' to view logs"
        
    else
        echo "📋 Manual authentication steps:"
        echo ""
        echo "1. Start bot with PM2: npm run pm2:start"
        echo "2. View logs: npm run pm2:logs"
        echo "3. Look for the pairing code in the logs"
        echo "4. Enter the pairing code in WhatsApp"
        echo ""
        echo "🔧 Or run this script again to use interactive mode"
    fi
}

# Main execution
check_pm2
setup_auth