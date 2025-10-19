@echo off
title Konoha WhatsApp Bot
color 0A
echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║                    🍃 KONOHA BOT 🍃                   ║
echo ║                                                      ║
echo ║            WhatsApp Bot Launcher (Windows)           ║
echo ╚══════════════════════════════════════════════════════╝
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the bot
echo 🚀 Starting Konoha Bot...
echo.
node src/bot.js

pause