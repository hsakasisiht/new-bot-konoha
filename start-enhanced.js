#!/usr/bin/env node

/**
 * 🍃 Konoha Bot - Enhanced Startup Script
 * Handles execution context errors and provides better error recovery
 */

const { spawn } = require('child_process');
const chalk = require('chalk');

let restartCount = 0;
const maxRestarts = 5;
const restartDelay = 10000; // 10 seconds

function startBot() {
    console.log(chalk.blue('🚀 Starting Konoha WhatsApp Bot...'));
    
    const bot = spawn('node', ['src/bot.js'], {
        stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            ...process.env,
            DISPLAY: process.env.DISPLAY || ':99',
            CHROME_BIN: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
            PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true'
        }
    });

    bot.on('close', (code, signal) => {
        if (signal) {
            console.log(chalk.yellow(`📱 Bot terminated by signal: ${signal}`));
            process.exit(0);
        }

        if (code === 0) {
            console.log(chalk.green('✅ Bot shut down gracefully'));
            process.exit(0);
        }

        console.log(chalk.red(`❌ Bot exited with code: ${code}`));
        
        if (restartCount < maxRestarts) {
            restartCount++;
            console.log(chalk.yellow(`🔄 Restarting bot (attempt ${restartCount}/${maxRestarts}) in ${restartDelay/1000} seconds...`));
            
            setTimeout(() => {
                startBot();
            }, restartDelay);
        } else {
            console.log(chalk.red('💥 Maximum restart attempts reached. Please check the logs and restart manually.'));
            process.exit(1);
        }
    });

    bot.on('error', (error) => {
        console.error(chalk.red('❌ Failed to start bot:', error.message));
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down...'));
        bot.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down...'));
        bot.kill('SIGTERM');
    });
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('Execution context was destroyed')) {
        console.log(chalk.yellow('⚠️ Execution context destroyed - this is normal during WhatsApp navigation'));
        return;
    }
    console.error(chalk.red('💥 Uncaught exception:', error));
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    if (error.message && error.message.includes('Execution context was destroyed')) {
        console.log(chalk.yellow('⚠️ Execution context destroyed - this is normal during WhatsApp navigation'));
        return;
    }
    console.error(chalk.red('💥 Unhandled rejection:', error));
    process.exit(1);
});

console.log(chalk.green('🍃 Konoha Bot Enhanced Startup'));
console.log(chalk.blue('💡 This script provides automatic error recovery'));
console.log(chalk.cyan('🔄 Maximum restarts: ' + maxRestarts));
console.log('');

startBot();