const chalk = require('chalk');
const config = require('../config');

/**
 * ShowContacts Command
 * Shows all configured contacts for Excel file delivery
 */
class ShowContactsCommand {
    constructor() {
        this.name = 'showcontacts';
        this.description = config.commands.showcontacts.description;
        this.enabled = config.commands.showcontacts.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the showcontacts command
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
                await message.reply('❌ Only the bot owner can view Excel delivery contacts!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for showcontacts: ${senderId}`));

            // Get contact count
            const contactCount = botInstance.contactManager.getContactCount();
            
            if (contactCount === 0) {
                await this.sendNoContactsMessage(message);
                return;
            }

            // Get formatted contact list
            const contactList = botInstance.contactManager.getFormattedContactList();
            
            // Add summary information
            let response = contactList;
            response += `\n📊 *Summary:*\n`;
            response += `• Total Contacts: ${contactCount}\n`;
            response += `• Google Drive: ${botInstance.googleDriveManager?.isConfigured() ? '✅ Configured' : '❌ Not Configured'}\n\n`;
            response += `💡 *Commands:*\n`;
            response += `• \`.fetchexcel\` - Send to all contacts\n`;
            response += `• \`.fetchexcel [nickname]\` - Send to specific contact\n`;
            response += `• \`.setcontact add\` - Add new contact`;

            await message.reply(response);

        } catch (error) {
            console.error(chalk.red('❌ Error in showcontacts command:', error.message));
            await message.reply('❌ An error occurred while retrieving contacts. Please try again later.');
        }
    }

    /**
     * Send message when no contacts are configured
     * @param {Object} message - WhatsApp message object
     */
    async sendNoContactsMessage(message) {
        let response = `📇 *Excel Delivery Contacts*\n\n`;
        response += `❌ No contacts configured for Excel delivery.\n\n`;
        response += `📋 *To add contacts:*\n\n`;
        response += `▶️ **Add Specific Contact:**\n`;
        response += `\`.setcontact add [nickname] [chatId] [name]\`\n`;
        response += `Example: \`.setcontact add admin 1234567890@c.us Admin Team\`\n\n`;
        response += `▶️ **Add Current Chat:**\n`;
        response += `\`.setcontact current [nickname] [name]\`\n`;
        response += `Example: \`.setcontact current reports Reports Team\`\n\n`;
        response += `💡 *Tip:* Once contacts are added, use \`.fetchexcel\` to send Excel files from Google Drive.`;

        await message.reply(response);
    }
}

module.exports = ShowContactsCommand;