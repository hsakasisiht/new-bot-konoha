const chalk = require('chalk');
const config = require('../config');

class GetChatIdCommand {
    constructor() {
        this.name = 'getchatid';
        this.description = config.commands.getchatid.description;
        this.enabled = config.commands.getchatid.enabled;
        this.usage = '.getchatid';
        this.groupOnly = false;
        this.ownerOnly = false;
    }

    /**
     * Execute the getchatid command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if user is bot owner or group owner
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            const isGroupOwner = botInstance.ownerManager.isOwner(message.from, senderId);
            
            if (!isBotOwner && !isGroupOwner) {
                await message.reply('❌ Only bot owner or group owners can get chat IDs!');
                return;
            }

            console.log(chalk.green(`✅ Authorized user requesting chat ID: ${senderId}`));

            const chatId = message.from;
            const chat = await message.getChat();
            
            let response = `📋 *Chat ID Information*\n\n`;
            response += `💬 **Chat ID:** \`${chatId}\`\n`;
            response += `📱 **Chat Type:** ${chat.isGroup ? 'Group Chat' : 'Personal Chat'}\n`;
            
            if (chat.isGroup) {
                response += `👥 **Group Name:** ${chat.name}\n`;
                response += `👤 **Members:** ${chat.participants.length}\n`;
            } else {
                response += `👤 **Contact Name:** ${chat.name || 'Unknown'}\n`;
            }
            
            response += `\n🔧 **Usage Examples:**\n`;
            response += `• Set auto-fetch: \`.setfolder [folderId] ${chatId} [nickname]\`\n`;
            response += `• Set contact: \`.setcontact add [name] ${chatId}\`\n\n`;
            response += `💡 **Tip:** Copy the chat ID above to use in folder mapping commands!`;
            
            await message.reply(response);

        } catch (error) {
            console.error(chalk.red('❌ Error in getchatid command:', error.message));
            await message.reply('❌ An error occurred while getting chat ID. Please try again later.');
        }
    }
}

module.exports = GetChatIdCommand;