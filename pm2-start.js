#!/usr/bin/env node

/**
 * 🍃 Konoha Bot - PM2 Wrapper
 * Ensures proper startup and session handling for PM2 deployment
 */

const path = require('path');
const chalk = require('chalk');

// Set environment variables for PM2 compatibility
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PRODUCTION = process.env.PRODUCTION || 'true';
process.env.PM2_HOME = process.env.PM2_HOME || true;

// Handle PM2 graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('🛑 PM2 SIGINT received - shutting down gracefully...'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('🛑 PM2 SIGTERM received - shutting down gracefully...'));
    process.exit(0);
});

// Handle uncaught exceptions gracefully in PM2
process.on('uncaughtException', (error) => {
    if (error.code === 'ERR_USE_AFTER_CLOSE') {
        console.log(chalk.yellow('⚠️ Readline interface closed - this is normal in PM2 environment'));
        return;
    }
    if (error.message && error.message.includes('Execution context was destroyed')) {
        console.log(chalk.yellow('⚠️ WhatsApp execution context destroyed - normal during navigation'));
        return;
    }
    console.error(chalk.red('💥 Uncaught exception:', error.message));
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    if (error.code === 'ERR_USE_AFTER_CLOSE') {
        console.log(chalk.yellow('⚠️ Readline promise rejection - this is normal in PM2 environment'));
        return;
    }
    if (error.message && error.message.includes('Execution context was destroyed')) {
        console.log(chalk.yellow('⚠️ WhatsApp execution context destroyed - normal during navigation'));
        return;
    }
    console.error(chalk.red('💥 Unhandled rejection:', error.message));
    process.exit(1);
});

console.log(chalk.blue('🍃 PM2 Wrapper: Starting Konoha Bot...'));
console.log(chalk.cyan(`📋 Process ID: ${process.pid}`));
console.log(chalk.cyan(`⚙️ Environment: ${process.env.NODE_ENV}`));

// Start the main bot
require('./src/bot.js');