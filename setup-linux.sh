#!/bin/bash

# 🍃 Konoha Bot - Linux Setup Script
# This script installs all required dependencies for running the WhatsApp bot on Ubuntu/Debian

echo "🍃 Konoha Bot - Linux Setup Script"
echo "=================================="
echo ""

# Update package manager
echo "📦 Updating package manager..."
sudo apt update

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📥 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install Chrome dependencies for Puppeteer
echo "🌐 Installing Chrome dependencies..."
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget

# Install additional dependencies for headless Chrome
echo "🎭 Installing additional headless Chrome dependencies..."
sudo apt-get install -y \
    libgbm-dev \
    libxkbcommon-x11-0 \
    libxss1 \
    libasound2

# Optional: Install Chrome browser (alternative to Chromium)
echo "📥 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "🚀 To start the bot, run:"
echo "   npm start"
echo ""
echo "📋 If you still encounter issues, try:"
echo "   export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true"
echo "   npm install puppeteer"
echo ""
echo "🔧 For headless server (no display), set:"
echo "   export DISPLAY=:99"
echo "   Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &"
echo ""