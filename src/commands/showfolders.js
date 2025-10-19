const chalk = require('chalk');
const config = require('../config');

/**
 * ShowFolders Command
 * Shows all folder mappings for different chats
 */
class ShowFoldersCommand {
    constructor() {
        this.name = 'showfolders';
        this.description = config.commands.showfolders.description;
        this.enabled = config.commands.showfolders.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the showfolders command
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
                await message.reply('❌ Only the bot owner can view folder mappings!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for showfolders: ${senderId}`));

            // Check if auto-fetch manager is available
            if (!botInstance.autoFetchManager) {
                await message.reply('❌ Auto-fetch system is not available!');
                return;
            }

                // Get active mappings from auto-fetch system (returned as a Map)
                const mappingsMap = botInstance.autoFetchManager.getAllMappings();
                // Convert to array of [folderId, mapping] entries and filter active ones
                const activeEntries = Array.from(mappingsMap.entries()).filter(([, m]) => m && m.isActive);
                const mappingCount = activeEntries.length;
            
                let response = `📁 *Auto-Fetch Folder Monitors*\n\n`;
            
                if (mappingCount > 0) {
                    // Show each active mapping
                    activeEntries.forEach(([folderId, mapping], index) => {
                        response += `**${index + 1}.** ${mapping.nickname}\n`;
                        response += `📁 Folder ID: \`${folderId.substring(0, 15)}...\`\n`;
                        response += `📄 Chat ID: \`${mapping.chatId}\`\n`;
                        response += `🔄 Status: ${mapping.isActive ? '✅ Active' : '❌ Inactive'}\n`;
                        if (mapping.lastCheck) {
                            response += `⏰ Last Check: ${new Date(mapping.lastCheck).toLocaleString()}\n`;
                        }
                        if (mapping.lastFileName) {
                            response += `📄 Last File: ${mapping.lastFileName}\n`;
                        }
                        response += `\n`;
                    });
                
                    response += `\n\u2022 *Summary:*\\n`;
                    response += `• Active Monitors: ${mappingCount}\n`;
                    response += `• Check Interval: ${Math.round((botInstance.autoFetchManager?.checkInterval || 300000)/60000)} minutes\n`;
                    response += `• Google Drive: ${botInstance.googleDriveManager?.isConfigured() ? '✅ Configured' : '❌ Not Configured'}\n\n`;
                    response += `💡 *Commands:*\n`;
                    response += `• \`.setfolder [folderId] [chatId] [nickname]\` - Add monitor\n`;
                    response += `• \`.stopfolder [folderId/nickname]\` - Stop monitor`;
                } else {
                    response += `⚠️ *No active folder monitors*\n\n`;
                    response += `📋 *To create auto-fetch monitor:*\n\n`;
                    response += `▶️ **Setup Auto-Fetch:**\n`;
                    response += `\`.setfolder [folderId] [chatId] [nickname]\`\n\n`;
                    response += `**Example:**\n`;
                    response += `\`.setfolder 1BxiMVs0XRA5nFMdKvBdBZjg 1234567890@c.us reports\`\n\n`;
                    response += `💡 *Benefits:* Latest Excel files automatically sent every ${Math.round((botInstance.autoFetchManager?.checkInterval || 300000)/60000)} minutes!`;
            }

            await message.reply(response);

        } catch (error) {
            console.error(chalk.red('❌ Error in showfolders command:', error.message));
            await message.reply('❌ An error occurred while retrieving folder mappings. Please try again later.');
        }
    }
}

module.exports = ShowFoldersCommand;