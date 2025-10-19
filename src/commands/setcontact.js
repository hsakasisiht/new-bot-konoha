const chalk = require('chalk');
const config = require('../config');

/**
 * SetContact Command
 * Sets contacts for Excel file delivery from Google Drive
 */
class SetContactCommand {
    constructor() {
        this.name = 'setcontact';
        this.description = config.commands.setcontact.description;
        this.enabled = config.commands.setcontact.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the setcontact command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments [action] [nickname] [chatId] [name]
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if user is bot owner
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            
            if (!isBotOwner) {
                await message.reply('❌ Only the bot owner can manage Excel delivery contacts!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified for setcontact: ${senderId}`));

            // Parse arguments
            if (args.length === 0) {
                await this.sendHelp(message);
                return;
            }

            const action = args[0].toLowerCase();

            switch (action) {
                case 'add':
                    await this.handleAddContact(message, args.slice(1), botInstance);
                    break;
                case 'remove':
                case 'delete':
                    await this.handleRemoveContact(message, args.slice(1), botInstance);
                    break;
                case 'update':
                    await this.handleUpdateContact(message, args.slice(1), botInstance);
                    break;
                case 'current':
                    await this.handleCurrentChat(message, args.slice(1), botInstance);
                    break;
                default:
                    await this.sendHelp(message);
                    break;
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in setcontact command:', error.message));
            await message.reply('❌ An error occurred while managing contacts. Please try again later.');
        }
    }

    /**
     * Handle adding a new contact
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [nickname] [chatId] [name]
     * @param {Object} botInstance - Bot instance
     */
    async handleAddContact(message, args, botInstance) {
        if (args.length < 2) {
            await message.reply('❌ Usage: `.setcontact add [nickname] [chatId] [name]`\n\nExample: `.setcontact add john 1234567890@c.us John Doe`');
            return;
        }

        const nickname = args[0];
        const chatId = args[1];
        const name = args.slice(2).join(' ') || nickname;

        // Validate chat ID format
        if (!this.isValidChatId(chatId)) {
            await message.reply('❌ Invalid chat ID format!\n\nExpected formats:\n• `1234567890@c.us` (personal)\n• `1234567890-1234567890@g.us` (group)');
            return;
        }

        // Check if nickname already exists
        if (botInstance.contactManager.hasContact(nickname)) {
            await message.reply(`❌ Contact "${nickname}" already exists!\n\nUse \`.setcontact update\` to modify existing contacts.`);
            return;
        }

        // Add the contact
        const success = await botInstance.contactManager.addContact(nickname, chatId, name);
        
        if (success) {
            let response = `✅ *Contact Added Successfully!*\n\n`;
            response += `📇 *Nickname:* ${nickname}\n`;
            response += `👤 *Name:* ${name}\n`;
            response += `💬 *Chat ID:* \`${chatId}\`\n\n`;
            response += `📊 This contact will now receive Excel files when you use \`.fetchexcel\`.`;
            
            await message.reply(response);
        } else {
            await message.reply('❌ Failed to add contact. Please try again.');
        }
    }

    /**
     * Handle removing a contact
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [nickname]
     * @param {Object} botInstance - Bot instance
     */
    async handleRemoveContact(message, args, botInstance) {
        if (args.length === 0) {
            await message.reply('❌ Usage: `.setcontact remove [nickname]`\n\nExample: `.setcontact remove john`');
            return;
        }

        const nickname = args[0];
        
        // Check if contact exists
        if (!botInstance.contactManager.hasContact(nickname)) {
            await message.reply(`❌ Contact "${nickname}" not found!\n\nUse \`.showcontacts\` to see available contacts.`);
            return;
        }

        // Remove the contact
        const success = await botInstance.contactManager.removeContact(nickname);
        
        if (success) {
            await message.reply(`✅ Contact "${nickname}" removed successfully!`);
        } else {
            await message.reply('❌ Failed to remove contact. Please try again.');
        }
    }

    /**
     * Handle updating a contact
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [nickname] [field] [value]
     * @param {Object} botInstance - Bot instance
     */
    async handleUpdateContact(message, args, botInstance) {
        if (args.length < 3) {
            await message.reply('❌ Usage: `.setcontact update [nickname] [field] [value]`\n\nFields: `name`, `chatid`\nExample: `.setcontact update john name John Smith`');
            return;
        }

        const nickname = args[0];
        const field = args[1].toLowerCase();
        const value = args.slice(2).join(' ');

        // Check if contact exists
        if (!botInstance.contactManager.hasContact(nickname)) {
            await message.reply(`❌ Contact "${nickname}" not found!\n\nUse \`.showcontacts\` to see available contacts.`);
            return;
        }

        // Validate field and value
        let updates = {};
        switch (field) {
            case 'name':
                updates.name = value;
                break;
            case 'chatid':
                if (!this.isValidChatId(value)) {
                    await message.reply('❌ Invalid chat ID format!');
                    return;
                }
                updates.chatId = value;
                break;
            default:
                await message.reply('❌ Invalid field! Available fields: `name`, `chatid`');
                return;
        }

        // Update the contact
        const success = await botInstance.contactManager.updateContact(nickname, updates);
        
        if (success) {
            await message.reply(`✅ Contact "${nickname}" updated successfully!\n\n${field}: ${value}`);
        } else {
            await message.reply('❌ Failed to update contact. Please try again.');
        }
    }

    /**
     * Handle setting current chat as contact
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Arguments [nickname] [name]
     * @param {Object} botInstance - Bot instance
     */
    async handleCurrentChat(message, args, botInstance) {
        if (args.length === 0) {
            await message.reply('❌ Usage: `.setcontact current [nickname] [name]`\n\nExample: `.setcontact current john John Doe`');
            return;
        }

        const nickname = args[0];
        const name = args.slice(1).join(' ') || nickname;
        const chatId = message.from;

        // Check if nickname already exists
        if (botInstance.contactManager.hasContact(nickname)) {
            await message.reply(`❌ Contact "${nickname}" already exists!\n\nUse \`.setcontact update\` to modify existing contacts.`);
            return;
        }

        // Add current chat as contact
        const success = await botInstance.contactManager.addContact(nickname, chatId, name);
        
        if (success) {
            let response = `✅ *Current Chat Added as Contact!*\n\n`;
            response += `📇 *Nickname:* ${nickname}\n`;
            response += `👤 *Name:* ${name}\n`;
            response += `💬 *Chat ID:* \`${chatId}\`\n\n`;
            response += `📊 This chat will now receive Excel files when you use \`.fetchexcel\`.`;
            
            await message.reply(response);
        } else {
            await message.reply('❌ Failed to add current chat as contact. Please try again.');
        }
    }

    /**
     * Validate chat ID format
     * @param {String} chatId - Chat ID to validate
     * @returns {Boolean} True if valid
     */
    isValidChatId(chatId) {
        // Personal chat: 1234567890@c.us
        // Group chat: 1234567890-1234567890@g.us
        // Linked device: 1234567890@lid
        const patterns = [
            /^\d+@c\.us$/,           // Personal chat
            /^\d+-\d+@g\.us$/,       // Group chat
            /^\d+@lid$/              // Linked device
        ];
        
        return patterns.some(pattern => pattern.test(chatId));
    }

    /**
     * Send command help
     * @param {Object} message - WhatsApp message object
     */
    async sendHelp(message) {
        let helpMsg = `📇 *Set Contact Command Help*\n\n`;
        helpMsg += `🎯 *Purpose:* Manage contacts for Excel file delivery\n\n`;
        helpMsg += `📋 *Available Actions:*\n\n`;
        helpMsg += `▶️ **Add Contact:**\n`;
        helpMsg += `\`.setcontact add [nickname] [chatId] [name]\`\n`;
        helpMsg += `Example: \`.setcontact add john 1234567890@c.us John Doe\`\n\n`;
        helpMsg += `▶️ **Add Current Chat:**\n`;
        helpMsg += `\`.setcontact current [nickname] [name]\`\n`;
        helpMsg += `Example: \`.setcontact current admin Admin Team\`\n\n`;
        helpMsg += `▶️ **Update Contact:**\n`;
        helpMsg += `\`.setcontact update [nickname] [field] [value]\`\n`;
        helpMsg += `Fields: \`name\`, \`chatid\`\n\n`;
        helpMsg += `▶️ **Remove Contact:**\n`;
        helpMsg += `\`.setcontact remove [nickname]\`\n`;
        helpMsg += `Example: \`.setcontact remove john\`\n\n`;
        helpMsg += `📱 *Chat ID Formats:*\n`;
        helpMsg += `• Personal: \`1234567890@c.us\`\n`;
        helpMsg += `• Group: \`1234567890-1234567890@g.us\`\n`;
        helpMsg += `• Linked Device: \`1234567890@lid\`\n\n`;
        helpMsg += `💡 *Tip:* Use \`.showcontacts\` to see all configured contacts.`;

        await message.reply(helpMsg);
    }
}

module.exports = SetContactCommand;