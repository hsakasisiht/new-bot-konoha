const KonohaBot = require('./src/bot');
const chalk = require('chalk');

// Simple launcher script
console.log(chalk.blue('🚀 Starting Konoha WhatsApp Bot...'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(chalk.red('💥 Uncaught Exception:', error.message));
    console.error(error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('💥 Unhandled Rejection at:', promise, 'reason:', reason));
    process.exit(1);
});

// The bot is already initialized and started in bot.js
// This file serves as an alternative entry point