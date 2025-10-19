const chalk = require('chalk');
const config = require('../config');

class HelpCommand {
    constructor() {
        this.name = 'help';
        this.description = config.commands.help.description;
        this.enabled = config.commands.help.enabled;
        this.usage = '.help [command]';
        this.groupOnly = false;
        this.ownerOnly = false;
    }

    /**
     * Execute the help command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            const isGroupOwner = botInstance.ownerManager.isOwner(message.from, senderId);

            // If specific command requested
            if (args.length > 0) {
                const commandName = args[0].toLowerCase();
                await this.showSpecificCommandHelp(message, commandName, botInstance, isBotOwner, isGroupOwner);
                return;
            }

            // Show general help with public commands only
            let helpMessage = `🤖 *${config.botName} - Commands Help*\n\n`;
            helpMessage += `📋 *Available Commands:*\n\n`;

            // Get all commands and filter based on user permissions
            const commands = botInstance.commandHandler.getCommandInfo();
            let availableCommands;
            
            if (isBotOwner || isGroupOwner) {
                // Show all commands for bot/group owners
                availableCommands = commands;
            } else {
                // Show only public commands for regular users
                availableCommands = commands.filter(cmd => !this.isOwnerOnlyCommand(cmd.name.replace('.', '')));
            }

            availableCommands.forEach(cmd => {
                const groupInfo = cmd.groupOnly ? ' 👥' : '';
                const ownerInfo = this.isOwnerOnlyCommand(cmd.name.replace('.', '')) ? ' 👑' : '';
                helpMessage += `🔸 *${cmd.name}*${groupInfo}${ownerInfo} - ${cmd.description}\n`;
            });

            helpMessage += `\n💡 *Usage Tips:*\n`;
            helpMessage += `• Use \`.help [command]\` for detailed info\n`;
            helpMessage += `• Commands start with "${config.prefix}"\n`;
            helpMessage += `• 👥 = Group chat only\n`;
            if (isBotOwner || isGroupOwner) {
                helpMessage += `• 👑 = Owner only\n`;
            }
            helpMessage += `\n🔗 *Example:* .help ping`;

            await message.reply(helpMessage);

        } catch (error) {
            console.error(chalk.red('❌ Error in help command:', error.message));
            await message.reply('❌ An error occurred while showing help. Please try again.');
        }
    }

    /**
     * Show help for a specific command
     */
    async showSpecificCommandHelp(message, commandName, botInstance, isBotOwner, isGroupOwner) {
        const commands = botInstance.commandHandler.getCommandInfo();
        const command = commands.find(cmd => cmd.name.toLowerCase() === commandName);

        if (!command) {
            await message.reply(`❌ Command "${commandName}" not found!\n\nUse .help to see all available commands.`);
            return;
        }

        // Check if user can access this command
        if (this.isOwnerOnlyCommand(commandName) && !isBotOwner && !isGroupOwner) {
            await message.reply(`❌ Command "${commandName}" not found!\n\nUse .help to see all available commands.`);
            return;
        }

        let cmdHelp = `📖 *Command Help: ${command.name}*\n\n`;
        cmdHelp += `📝 *Description:* ${command.description}\n`;
        cmdHelp += `🎯 *Usage:* \`.${command.name}\`\n`;
        
        if (command.groupOnly) {
            cmdHelp += `👥 *Restriction:* Group chats only\n`;
        }

        if (this.isOwnerOnlyCommand(commandName)) {
            cmdHelp += `👑 *Restriction:* Bot/Group owners only\n`;
        }

        // Add specific usage examples for certain commands
        cmdHelp += this.getCommandExamples(commandName);

        await message.reply(cmdHelp);
    }

    /**
     * Get usage examples for specific commands
     */
    getCommandExamples(commandName) {
        const examples = {
            'ping': `\n💡 *Example:* \`.ping\`\n📊 Shows bot status and uptime`,
            
            'tagall': `\n💡 *Example:* \`.tagall Come online everyone!\`\n📢 Tags all group members with message`,
            
            'groupinfo': `\n💡 *Example:* \`.groupinfo\`\n📊 Shows group details and member count`,
            
            'joke': `\n💡 *Example:* \`.joke\`\n😄 Sends a random joke`,
            
            'meme': `\n💡 *Example:* \`.meme\`\n😂 Sends a random meme`,
            
            'translate': `\n💡 *Examples:*\n\`.translate en hi Hello world\` - Translate to Hindi\n\`.translate auto fr Bonjour\` - Auto-detect to French`,
            
            'translat': `\n💡 *Example:* Reply to a message with \`.translat hi\`\n🌐 Translates replied message to Hindi`,
            
            'analyze': `\n💡 *Usage:* Send Excel file with \`.analyze\`\n📊 Analyzes player performance data`,
            
            'getchatid': `\n💡 *Example:* \`.getchatid\`\n📋 Shows current chat ID for folder setup`
        };

        return examples[commandName] || '';
    }

    /**
     * Check if command is owner-only
     */
    isOwnerOnlyCommand(commandName) {
        const ownerCommands = [
            'ownerset', 'ownerreset', 'fetchexcel', 'setcontact', 'showcontacts', 
            'setfolder', 'showfolders', 'stopfolder', 'authdrive'
        ];
        return ownerCommands.includes(commandName.toLowerCase());
    }
}

module.exports = HelpCommand;