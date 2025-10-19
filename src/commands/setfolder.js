const chalk = require('chalk');
const config = require('../config');

/**
 * SetFolder Command
 * Sets up automatic Excel fetching from Google Drive folders to specific chats
 */
class SetFolderCommand {
    constructor() {
        this.name = 'setfolder';
        this.description = config.commands.setfolder.description;
        this.enabled = config.commands.setfolder.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the setfolder command
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
                await message.reply('❌ Only the bot owner can manage folder mappings!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for setfolder: ${senderId}`));

            // Check if Google Drive is configured
            if (!botInstance.googleDriveManager || !botInstance.googleDriveManager.isConfigured()) {
                await message.reply('❌ Google Drive is not configured! Please set up Google Drive first.');
                return;
            }

            // Parse arguments - Simple format: .setfolder [drive_id] [chat_id] [nickname]
            if (args.length < 2) {
                await this.sendHelp(message);
                return;
            }

            const folderId = args[0];
            const chatId = args[1] || message.from; // Use current chat if not specified
            const nickname = args[2] || `auto_${folderId.substring(0, 8)}`;

            // Set up auto-fetch mapping
            await this.handleAutoFetchSetup(message, folderId, chatId, nickname, botInstance);

        } catch (error) {
            console.error(chalk.red('❌ Error in setfolder command:', error.message));
            await message.reply('❌ An error occurred while managing folder mappings. Please try again later.');
        }
    }

    /**
     * Handle setting up auto-fetch mapping
     * @param {Object} message - WhatsApp message object
     * @param {String} folderId - Google Drive folder ID
     * @param {String} chatId - WhatsApp chat ID
     * @param {String} nickname - Nickname for the mapping
     * @param {Object} botInstance - Bot instance
     */
    async handleAutoFetchSetup(message, folderId, chatId, nickname, botInstance) {
        // Validate chat ID format
        if (!this.isValidChatId(chatId)) {
            await message.reply('❌ Invalid chat ID format!\n\nExpected formats:\n• `1234567890@c.us` (personal)\n• `1234567890-1234567890@g.us` (group)');
            return;
        }

        // Validate folder ID
        if (!this.isValidFolderId(folderId)) {
            await message.reply('❌ Invalid Google Drive folder ID format!\n\nFolder ID should be like: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`');
            return;
        }

        await message.reply('🔍 Setting up auto-fetch system...');

        // Test folder access first
        const folderValid = await botInstance.googleDriveManager.validateFolder(folderId);
        if (!folderValid) {
            await message.reply('❌ Cannot access the specified folder! Please check:\n• Folder ID is correct\n• Folder is shared with your Google account\n• You have read permissions');
            return;
        }

        // Add auto-fetch mapping
        const result = await botInstance.autoFetchManager.addMapping(folderId, chatId, nickname);
        
        if (result.success) {
            let response = `✅ *Auto-Fetch Setup Complete!*\n\n`;
            response += `� *Folder ID:* \`${folderId}\`\n`;
            response += `� *Chat ID:* \`${chatId}\`\n`;
            response += `🏷️ *Nickname:* ${nickname}\n\n`;
            response += `� *Auto-Monitoring Started*\n`;
            response += `⏱️ *Check Interval:* 5 minutes\n`;
            response += `📊 *Latest Excel files will be automatically sent to this chat*\n\n`;
            response += `💡 Use \`.showfolders\` to see all active monitors`;
            
            await message.reply(response);
        } else {
            await message.reply(`❌ Failed to setup auto-fetch: ${result.error}`);
        }
    }

    /**
     * Handle removing a folder mapping
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [chatId]
     * @param {Object} botInstance - Bot instance
     */
    async handleRemoveMapping(message, args, botInstance) {
        if (args.length === 0) {
            await message.reply('❌ Usage: `.setfolder remove [chatId]`\n\nExample: `.setfolder remove 1234567890@c.us`');
            return;
        }

        const chatId = args[0];
        
        // Check if mapping exists
        if (!botInstance.folderMappingManager.hasMapping(chatId)) {
            await message.reply(`❌ No folder mapping found for chat \`${chatId}\`!\n\nUse \`.showfolders\` to see all mappings.`);
            return;
        }

        // Get mapping details for confirmation
        const mapping = botInstance.folderMappingManager.getMapping(chatId);
        
        // Remove the mapping
        const success = await botInstance.folderMappingManager.removeMapping(chatId);
        
        if (success) {
            let response = `✅ *Folder Mapping Removed!*\n\n`;
            response += `📱 *Chat ID:* \`${chatId}\`\n`;
            response += `🏷️ *Was:* ${mapping.nickname}\n`;
            response += `📁 *Previous Folder:* ${mapping.folderName}\n\n`;
            response += `🔄 This chat will now use the default folder for Excel files.`;
            
            await message.reply(response);
        } else {
            await message.reply('❌ Failed to remove folder mapping. Please try again.');
        }
    }

    /**
     * Handle updating a folder mapping
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [chatId] [field] [value]
     * @param {Object} botInstance - Bot instance
     */
    async handleUpdateMapping(message, args, botInstance) {
        if (args.length < 3) {
            await message.reply('❌ Usage: `.setfolder update [chatId] [field] [value]`\n\nFields: `folderid`, `nickname`, `foldername`\nExample: `.setfolder update 1234@c.us folderid 1BxiMVs0XRA5nFMdKvBdBZjg`');
            return;
        }

        const chatId = args[0];
        const field = args[1].toLowerCase();
        const value = args.slice(2).join(' ');

        // Check if mapping exists
        if (!botInstance.folderMappingManager.hasMapping(chatId)) {
            await message.reply(`❌ No folder mapping found for chat \`${chatId}\`!\n\nUse \`.showfolders\` to see all mappings.`);
            return;
        }

        // Validate field and value
        let updates = {};
        switch (field) {
            case 'folderid':
                if (!this.isValidFolderId(value)) {
                    await message.reply('❌ Invalid Google Drive folder ID format!');
                    return;
                }
                // Validate folder access
                await message.reply('🔍 Validating new folder...');
                const folderValid = await botInstance.googleDriveManager.validateFolder(value);
                if (!folderValid) {
                    await message.reply('❌ Cannot access the specified folder!');
                    return;
                }
                updates.folderId = value;
                break;
            case 'nickname':
                updates.nickname = value;
                break;
            case 'foldername':
                updates.folderName = value;
                break;
            default:
                await message.reply('❌ Invalid field! Available fields: `folderid`, `nickname`, `foldername`');
                return;
        }

        // Update the mapping
        const success = await botInstance.folderMappingManager.updateMapping(chatId, updates);
        
        if (success) {
            await message.reply(`✅ Folder mapping updated successfully!\n\n**${field}:** ${value}`);
        } else {
            await message.reply('❌ Failed to update folder mapping. Please try again.');
        }
    }

    /**
     * Handle setting current chat as folder mapping
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [folderId] [nickname] [folderName]
     * @param {Object} botInstance - Bot instance
     */
    async handleCurrentChat(message, args, botInstance) {
        if (args.length === 0) {
            await message.reply('❌ Usage: `.setfolder current [folderId] [nickname] [folderName]`\n\nExample: `.setfolder current 1BxiMVs0XRA5nFMdKvBdBZjg admin Admin Reports`');
            return;
        }

        const folderId = args[0];
        const nickname = args[1] || 'current_chat';
        const folderName = args.slice(2).join(' ') || `Folder_${folderId.substring(0, 8)}`;
        const chatId = message.from;

        // Validate folder ID
        if (!this.isValidFolderId(folderId)) {
            await message.reply('❌ Invalid Google Drive folder ID format!');
            return;
        }

        // Test folder access
        await message.reply('🔍 Validating folder access...');
        const folderValid = await botInstance.googleDriveManager.validateFolder(folderId);
        if (!folderValid) {
            await message.reply('❌ Cannot access the specified folder!');
            return;
        }

        // Check if mapping already exists
        if (botInstance.folderMappingManager.hasMapping(chatId)) {
            await message.reply('❌ This chat already has a folder mapping!\n\nUse `.setfolder update` to modify it.');
            return;
        }

        // Set current chat as mapping
        const success = await botInstance.folderMappingManager.setMapping(chatId, folderId, folderName, nickname);
        
        if (success) {
            let response = `✅ *Current Chat Mapped to Folder!*\n\n`;
            response += `📱 *This Chat ID:* \`${chatId}\`\n`;
            response += `📁 *Folder ID:* \`${folderId}\`\n`;
            response += `🏷️ *Nickname:* ${nickname}\n`;
            response += `📂 *Folder Name:* ${folderName}\n\n`;
            response += `🎯 Excel files for this chat will now come from this specific folder.`;
            
            await message.reply(response);
        } else {
            await message.reply('❌ Failed to map current chat to folder. Please try again.');
        }
    }

    /**
     * Handle setting default folder
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [folderId]
     * @param {Object} botInstance - Bot instance
     */
    async handleSetDefault(message, args, botInstance) {
        if (args.length === 0) {
            await message.reply('❌ Usage: `.setfolder default [folderId]`\n\nExample: `.setfolder default 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`');
            return;
        }

        const folderId = args[0];

        // Validate folder ID
        if (!this.isValidFolderId(folderId)) {
            await message.reply('❌ Invalid Google Drive folder ID format!');
            return;
        }

        // Test folder access
        await message.reply('🔍 Validating folder access...');
        const folderValid = await botInstance.googleDriveManager.validateFolder(folderId);
        if (!folderValid) {
            await message.reply('❌ Cannot access the specified folder!');
            return;
        }

        // Set default folder
        botInstance.folderMappingManager.setDefaultFolder(folderId);
        
        await message.reply(`✅ *Default Folder Updated!*\n\n📁 *New Default:* \`${folderId}\`\n\n💡 Chats without specific folder mappings will use this folder.`);
    }

    /**
     * Validate chat ID format
     * @param {String} chatId - Chat ID to validate
     * @returns {Boolean} True if valid
     */
    isValidChatId(chatId) {
        const patterns = [
            /^\d+@c\.us$/,           // Personal chat
            /^\d+-\d+@g\.us$/,       // Group chat
            /^\d+@lid$/              // Linked device
        ];
        return patterns.some(pattern => pattern.test(chatId));
    }

    /**
     * Validate Google Drive folder ID format
     * @param {String} folderId - Folder ID to validate
     * @returns {Boolean} True if valid
     */
    isValidFolderId(folderId) {
        // Google Drive folder IDs are typically 33-44 characters of alphanumeric, hyphens, underscores
        return /^[a-zA-Z0-9_-]{20,50}$/.test(folderId);
    }

    /**
     * Send command help
     * @param {Object} message - WhatsApp message object
     */
    async sendHelp(message) {
        let helpMsg = `📁 *Folder Mapping Command Help*\n\n`;
        helpMsg += `🎯 *Purpose:* Map different Google Drive folders to specific chats\n\n`;
        helpMsg += `📋 *Available Actions:*\n\n`;
        helpMsg += `▶️ **Set Mapping:**\n`;
        helpMsg += `\`.setfolder add [chatId] [folderId] [nickname] [folderName]\`\n\n`;
        helpMsg += `▶️ **Map Current Chat:**\n`;
        helpMsg += `\`.setfolder current [folderId] [nickname] [folderName]\`\n\n`;
        helpMsg += `▶️ **Update Mapping:**\n`;
        helpMsg += `\`.setfolder update [chatId] [field] [value]\`\n`;
        helpMsg += `Fields: \`folderid\`, \`nickname\`, \`foldername\`\n\n`;
        helpMsg += `▶️ **Remove Mapping:**\n`;
        helpMsg += `\`.setfolder remove [chatId]\`\n\n`;
        helpMsg += `▶️ **Set Default Folder:**\n`;
        helpMsg += `\`.setfolder default [folderId]\`\n\n`;
        helpMsg += `📂 *Folder ID:* Get from Google Drive URL\n`;
        helpMsg += `\`https://drive.google.com/drive/folders/FOLDER_ID_HERE\`\n\n`;
        helpMsg += `💡 *Tip:* Use \`.showfolders\` to see all mappings.`;

        await message.reply(helpMsg);
    }
}

module.exports = SetFolderCommand;