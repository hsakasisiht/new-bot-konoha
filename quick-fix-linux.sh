#!/bin/bash

# 🔧 Quick Fix for Puppeteer Chrome Dependencies on Ubuntu
echo "🔧 Installing essential Chrome dependencies..."

# Install the most critical missing libraries
sudo apt-get update
sudo apt-get install -y \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2

echo "✅ Dependencies installed!"
echo "🚀 Try running 'npm start' again"