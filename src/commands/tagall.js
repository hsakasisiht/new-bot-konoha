const chalk = require('chalk');
const config = require('../config');

/**
 * TagAll Command
 * Tags all members in a group with optional custom message
 */
class TagAllCommand {
    constructor() {
        this.name = 'tagall';
        this.description = config.commands.tagall.description;
        this.enabled = config.commands.tagall.enabled;
        this.groupOnly = config.commands.tagall.groupOnly;
    }

    /**
     * Execute the tagall command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            const chat = await message.getChat();
            
            // Check if it's a group
            if (!chat.isGroup) {
                await message.reply(config.messages.groupOnly);
                return;
            }

            // Get all participants
            const participants = chat.participants;
            
            if (participants.length === 0) {
                await message.reply('❌ No participants found in this group.');
                return;
            }

            // Create mention list
            let mentions = [];
            let tagText = '';
            
            // Use custom message if provided, otherwise use default
            if (args.length > 0) {
                tagText = `📢 ${args.join(' ')}\n\n`;
            } else {
                tagText = `${config.messages.tagallPrefix}\n\n`;
            }

            // Add all participants to mentions
            for (const participant of participants) {
                // Workaround: getContactById is failing due to WWebJS internal error
                // We pass the serialized ID string directly as the library expects Contact objects or strings
                // Passing the raw participant object fails because it's not a Contact instance
                mentions.push(participant.id._serialized);
                tagText += `@${participant.id.user} `;
            }

            // Send the message with mentions
            await chat.sendMessage(tagText, {
                mentions: mentions
            });

            console.log(chalk.green(`👥 Tagged ${participants.length} members in group ${chat.name}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Error in tagall command:', error.message));
            await message.reply('❌ Failed to tag all members. Please try again.');
        }
    }
}

module.exports = TagAllCommand;