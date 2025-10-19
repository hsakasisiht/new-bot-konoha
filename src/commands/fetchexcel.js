const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const config = require('../config');

/**
 * FetchExcel Command
 * Fetches latest Excel file from Google Drive and sends to configured contacts
 */
class FetchExcelCommand {
    constructor() {
        this.name = 'fetchexcel';
        this.description = config.commands.fetchexcel.description;
        this.enabled = config.commands.fetchexcel.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the fetchexcel command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments [contactNickname] (optional)
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if user is bot owner
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            
            if (!isBotOwner) {
                await message.reply('❌ Only the bot owner can fetch Excel files from Google Drive!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for fetchexcel: ${senderId}`));

            // Check if Google Drive is configured
            if (!botInstance.googleDriveManager || !botInstance.googleDriveManager.isConfigured()) {
                await this.sendConfigurationHelp(message);
                return;
            }

            // Check if any contacts are configured
            const contactCount = botInstance.contactManager.getContactCount();
            if (contactCount === 0) {
                await message.reply('❌ No contacts configured for Excel delivery!\n\nUse `.setcontact` to add contacts first.');
                return;
            }

            await message.reply('🔄 Fetching latest Excel file from Google Drive...');

            // Determine which contacts to send to first (to know which folder to use)
            let targetContacts = [];
            
            if (args.length > 0) {
                // Send to specific contact
                const nickname = args[0].toLowerCase();
                const contact = botInstance.contactManager.getContact(nickname);
                if (contact) {
                    targetContacts.push({ nickname, ...contact });
                } else {
                    await message.reply(`❌ Contact "${args[0]}" not found!\n\nUse \`.showcontacts\` to see available contacts.`);
                    return;
                }
            } else {
                // Send to all contacts
                const allContacts = botInstance.contactManager.getAllContacts();
                allContacts.forEach((contact, nickname) => {
                    targetContacts.push({ nickname, ...contact });
                });
            }

            // Group contacts by their folder mappings
            const folderGroups = new Map();
            
            for (const contact of targetContacts) {
                // First try folder mapping manager
                let folderId = botInstance.folderMappingManager.getFolderForChat(contact.chatId);
                
                // If no folder found, try auto-fetch mappings
                if (!folderId && botInstance.autoFetchManager) {
                    const autoMappings = botInstance.autoFetchManager.getAllMappings();
                    for (const [autoFolderId, mapping] of autoMappings) {
                        if (mapping.chatId === contact.chatId && mapping.isActive) {
                            folderId = autoFolderId;
                            console.log(chalk.blue(`📁 Using auto-fetch folder ${autoFolderId} for contact ${contact.nickname}`));
                            break;
                        }
                    }
                }
                
                if (!folderGroups.has(folderId)) {
                    folderGroups.set(folderId, []);
                }
                folderGroups.get(folderId).push(contact);
            }

            await message.reply(`🔄 Processing ${folderGroups.size} folder(s) for ${targetContacts.length} contact(s)...`);

            let totalSuccess = 0;
            let totalFail = 0;

            // Process each folder group
            for (const [folderId, contacts] of folderGroups) {
                try {
                    // Get latest Excel file from this specific folder
                    const latestFile = await botInstance.googleDriveManager.getLatestExcelFile(folderId);
                    if (!latestFile) {
                        console.log(chalk.yellow(`⚠️ No Excel files found in folder: ${folderId}`));
                        await message.reply(`⚠️ No Excel files found in folder \`${folderId}\` for ${contacts.length} contact(s)`);
                        totalFail += contacts.length;
                        continue;
                    }

                    console.log(chalk.cyan(`📄 Latest file from folder ${folderId}: ${latestFile.name}`));

                    // Download the file
                    const downloadDir = './temp/excel';
                    const fileName = `${Date.now()}_${folderId.substring(0, 8)}_${latestFile.name}`;
                    const filePath = path.join(downloadDir, fileName);

                    await message.reply(`📥 Downloading: *${latestFile.name}* (for ${contacts.length} contact(s))`);

                    const downloadSuccess = await botInstance.googleDriveManager.downloadFile(latestFile.id, filePath);
                    if (!downloadSuccess) {
                        await message.reply(`❌ Failed to download Excel file from folder: ${folderId}`);
                        totalFail += contacts.length;
                        continue;
                    }

                    // Send file to contacts in this group
                    for (const contact of contacts) {
                        try {
                            const { MessageMedia } = require('whatsapp-web.js');
                            const media = MessageMedia.fromFilePath(filePath);
                            const caption = `📊 *Latest Excel File*\n\n📁 *File:* ${latestFile.name}\n📅 *Modified:* ${new Date(latestFile.modifiedTime).toLocaleString()}\n🗂️ *From Folder:* ${folderId.substring(0, 12)}...\n🤖 *Sent by ${config.botName}*`;
                            
                            await client.sendMessage(contact.chatId, media, { caption });

                            console.log(chalk.green(`✅ Sent ${latestFile.name} to ${contact.nickname} (${contact.chatId})`));
                            totalSuccess++;
                        } catch (sendError) {
                            console.error(chalk.red(`❌ Failed to send to ${contact.nickname}:`, sendError.message));
                            totalFail++;
                        }
                    }

                    // Clean up downloaded file
                    await fs.remove(filePath);

                } catch (folderError) {
                    console.error(chalk.red(`❌ Error processing folder ${folderId}:`, folderError.message));
                    await message.reply(`❌ Error processing folder \`${folderId}\`: ${folderError.message}`);
                    totalFail += contacts.length;
                }
            }

            // Send final summary
            let summary = `📊 *Multi-Folder Excel Delivery Summary*\n\n`;
            summary += `📁 *Folders Processed:* ${folderGroups.size}\n`;
            summary += `✅ *Successful Deliveries:* ${totalSuccess}\n`;
            summary += `❌ *Failed Deliveries:* ${totalFail}\n`;
            summary += `📱 *Total Contacts:* ${targetContacts.length}\n\n`;
            summary += `� *Note:* Each contact received files from their mapped folder or default folder.`;

            await message.reply(summary);

        } catch (error) {
            console.error(chalk.red('❌ Error in fetchexcel command:', error.message));
            await message.reply('❌ An error occurred while fetching Excel file. Please try again later.');
        }
    }

    /**
     * Send configuration help message
     * @param {Object} message - WhatsApp message object
     */
    async sendConfigurationHelp(message) {
        let helpMsg = `🔧 *Google Drive Configuration Required*\n\n`;
        helpMsg += `❌ Google Drive is not properly configured.\n\n`;
        helpMsg += `📋 *Setup Steps:*\n`;
        helpMsg += `1️⃣ Add Google credentials file\n`;
        helpMsg += `2️⃣ Authenticate with Google\n`;
        helpMsg += `3️⃣ Set folder ID\n`;
        helpMsg += `4️⃣ Add delivery contacts\n\n`;
        helpMsg += `📁 *Files Needed:*\n`;
        helpMsg += `• \`config/google-credentials.json\`\n`;
        helpMsg += `• \`config/google-token.json\` (auto-generated)\n\n`;
        helpMsg += `💡 *Contact your system administrator for setup assistance.*`;

        await message.reply(helpMsg);
    }
}

module.exports = FetchExcelCommand;