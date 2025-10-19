const chalk = require('chalk');
const moment = require('moment');
const config = require('./config');
const CommandLoader = require('./commands');

class CommandHandler {
    constructor(client, botInstance = null) {
        this.client = client;
        this.botInstance = botInstance;
        this.prefix = config.prefix;
        this.commands = new Map();
        this.initializeCommands();
    }

    /**
     * Initialize all available commands
     */
    initializeCommands() {
        // Load commands from the commands directory
        this.commands = CommandLoader.loadCommands();
        
        console.log(chalk.blue(`🔧 Loaded ${this.commands.size} commands`));
        
        // Log loaded commands
        if (this.commands.size > 0) {
            const commandNames = Array.from(this.commands.keys()).join(', ');
            console.log(chalk.cyan(`� Available: ${commandNames}`));
        }
    }

    /**
     * Process incoming message and execute commands
     */
    async handleMessage(message) {
        const content = message.body.trim();
        
        // Check if message starts with prefix
        if (!content.startsWith(this.prefix)) {
            return;
        }

        // Parse command and arguments
        const args = content.slice(this.prefix.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        // Get command
        const command = this.commands.get(commandName);
        if (!command) {
            await this.sendUnknownCommand(message);
            return;
        }

        // Check if command is enabled
        if (!command.enabled) {
            return;
        }

        // Check if command is group-only and message is from group
        if (command.groupOnly && !message.from.includes('@g.us')) {
            await message.reply(config.messages.groupOnly);
            return;
        }

        try {
            console.log(chalk.cyan(`📝 Executing command: ${commandName} from ${message.from}`));
            await command.execute(message, args, this.client, this.botInstance);
        } catch (error) {
            console.error(chalk.red(`❌ Error executing command ${commandName}:`, error.message));
        }
    }



    /**
     * Send unknown command message
     */
    async sendUnknownCommand(message) {
        await message.reply(`❓ *Unknown command!*\n\n💡 Use \`.help\` to see all available commands\n🔗 Example: \`.help ping\` for specific command info`);
    }

    /**
     * Get bot status information
     */
    getBotStatus() {
        if (this.botInstance) {
            return this.botInstance.getStatus();
        }
        
        // Fallback if bot instance not available
        return {
            uptime: 'Unknown',
            startTime: 'Unknown',
            ready: true
        };
    }

    /**
     * Get command information
     */
    getCommandInfo() {
        const commandList = [];
        this.commands.forEach((command, name) => {
            if (command.enabled) {
                commandList.push({
                    name: `${this.prefix}${name}`,
                    description: command.description,
                    groupOnly: command.groupOnly || false
                });
            }
        });
        return commandList;
    }
}

module.exports = CommandHandler;