const chalk = require('chalk');

class StopFolderCommand {
    constructor() {
        this.name = 'stopfolder';
        this.description = 'Stop auto-fetching from a specific Google Drive folder';
        this.usage = '.stopfolder [folderId] or .stopfolder [nickname]';
        this.groupOnly = false;
        this.ownerOnly = false;
    }

    /**
     * Execute the stopfolder command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if user is bot owner
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            
            if (!isBotOwner) {
                await message.reply('❌ Only the bot owner can manage folder monitoring!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for stopfolder: ${senderId}`));

            // Check if auto-fetch manager is available
            if (!botInstance.autoFetchManager) {
                await message.reply('❌ Auto-fetch system is not available!');
                return;
            }

            // Check arguments
            if (args.length === 0) {
                await this.sendHelp(message);
                return;
            }

            const identifier = args[0]; // Can be folderId or nickname

            // Stop the folder monitoring
            const result = await botInstance.autoFetchManager.removeMapping(identifier);
            
            if (result.success) {
                let response = `✅ *Auto-Fetch Stopped*\n\n`;
                response += `📁 *Folder:* ${result.folderInfo ? result.folderInfo.nickname : identifier}\n`;
                response += `🛑 *Status:* Monitoring stopped\n`;
                response += `💬 *Chat:* ${result.folderInfo ? result.folderInfo.chatId : 'Unknown'}\n\n`;
                response += `💡 Use \`.showfolders\` to see remaining active monitors`;
                
                await message.reply(response);
            } else {
                if (result.error.includes('not found')) {
                    await message.reply(`❌ No auto-fetch mapping found for: \`${identifier}\`\n\n💡 Use \`.showfolders\` to see all active mappings`);
                } else {
                    await message.reply(`❌ Failed to stop monitoring: ${result.error}`);
                }
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in stopfolder command:', error.message));
            await message.reply('❌ An error occurred while stopping folder monitoring. Please try again later.');
        }
    }

    /**
     * Send help message
     */
    async sendHelp(message) {
        let help = `📋 *Stop Folder Command Help*\n\n`;
        help += `**Usage:**\n`;
        help += `\`${this.usage}\`\n\n`;
        help += `**Examples:**\n`;
        help += `• \`.stopfolder 1BxiMVs0XRA5nFMdKvBdBZjg\` - Stop by folder ID\n`;
        help += `• \`.stopfolder guild_reports\` - Stop by nickname\n\n`;
        help += `**Description:**\n`;
        help += `Stops automatic monitoring of a Google Drive folder. You can identify the folder either by its Google Drive folder ID or by the nickname you assigned when setting it up.\n\n`;
        help += `💡 **Tip:** Use \`.showfolders\` to see all active folder monitors with their IDs and nicknames.`;
        
        await message.reply(help);
    }

    /**
     * Validate folder ID format
     */
    isValidFolderId(folderId) {
        // Google Drive folder IDs are typically 25-44 characters long, alphanumeric with some special chars
        const folderIdPattern = /^[a-zA-Z0-9_-]{25,44}$/;
        return folderIdPattern.test(folderId);
    }
}

module.exports = StopFolderCommand;