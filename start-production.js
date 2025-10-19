#!/usr/bin/env node

/**
 * 🍃 Konoha Bot - Production Startup Script
 * Optimized for production with minimal logging and auto-restart
 */

const { spawn } = require('child_process');
const chalk = require('chalk');

let restartCount = 0;
const maxRestarts = 10;
const restartDelay = 15000; // 15 seconds

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PRODUCTION = 'true';

function startBot() {
    console.log(chalk.green(`🍃 Starting Konoha Bot (Production Mode) - Attempt ${restartCount + 1}`));
    
    const bot = spawn('node', ['src/bot.js'], {
        stdio: ['inherit', 'inherit', 'inherit'],
        env: {
            ...process.env,
            NODE_ENV: 'production',
            PRODUCTION: 'true',
            DISPLAY: process.env.DISPLAY || ':99',
            CHROME_BIN: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
            PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true'
        }
    });

    bot.on('close', (code, signal) => {
        const timestamp = new Date().toISOString();
        
        if (signal) {
            console.log(chalk.yellow(`[${timestamp}] Bot terminated by signal: ${signal}`));
            process.exit(0);
        }

        if (code === 0) {
            console.log(chalk.green(`[${timestamp}] Bot shut down gracefully`));
            process.exit(0);
        }

        console.log(chalk.red(`[${timestamp}] Bot exited with code: ${code}`));
        
        if (restartCount < maxRestarts) {
            restartCount++;
            console.log(chalk.yellow(`🔄 Auto-restart (${restartCount}/${maxRestarts}) in ${restartDelay/1000}s...`));
            
            setTimeout(() => {
                startBot();
            }, restartDelay);
        } else {
            console.log(chalk.red('💥 Maximum restart attempts reached. Manual intervention required.'));
            console.log(chalk.blue('💡 Check logs and restart with: npm run start:prod'));
            process.exit(1);
        }
    });

    bot.on('error', (error) => {
        console.error(chalk.red(`❌ Failed to start bot: ${error.message}`));
        process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Production shutdown initiated...'));
        bot.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        console.log(chalk.yellow('\n🛑 Production shutdown (SIGTERM)...'));
        bot.kill('SIGTERM');
    });
}

// Handle production-level errors
process.on('uncaughtException', (error) => {
    if (error.message && error.message.includes('Execution context was destroyed')) {
        // Silently handle execution context errors in production
        return;
    }
    console.error(chalk.red('💥 Uncaught exception in production:', error.message));
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    if (error.message && error.message.includes('Execution context was destroyed')) {
        // Silently handle execution context errors in production
        return;
    }
    console.error(chalk.red('💥 Unhandled rejection in production:', error.message));
    process.exit(1);
});

// Production banner
console.log(chalk.green.bold('🍃 Konoha Bot - Production Mode'));
console.log(chalk.blue('📊 Features: Minimal logging | Auto-restart | Command tracking'));
console.log(chalk.cyan('🔧 Max restarts: ' + maxRestarts + ' | Restart delay: ' + (restartDelay/1000) + 's'));
console.log('');

startBot();