const chalk = require('chalk');
const config = require('../config');

/**
 * OwnerReset Command
 * Removes group owner permissions
 */
class OwnerResetCommand {
    constructor() {
        this.name = 'ownerreset';
        this.description = config.commands.ownerreset.description;
        this.enabled = config.commands.ownerreset.enabled;
        this.groupOnly = config.commands.ownerreset.groupOnly;
        this.adminOnly = config.commands.ownerreset.adminOnly;
    }

    /**
     * Execute the ownerreset command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if it's a group
            if (!message.from.includes('@g.us')) {
                await message.reply('❌ This command can only be used in groups!');
                return;
            }

            // Check if user is bot owner
            const senderId = message.author || message.from;
            const isBotOwner = botInstance.ownerManager.isBotOwner(senderId);
            
            console.log(chalk.cyan(`🔍 Bot owner check: ${senderId} = ${isBotOwner}`));
            
            if (!isBotOwner) {
                await message.reply('❌ Only the bot owner can reset group owners!');
                console.log(chalk.yellow(`⚠️ Unauthorized ownerreset attempt by ${senderId}`));
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified: ${senderId}`));

            const groupId = message.from;
            const currentOwner = botInstance.ownerManager.getOwner(groupId);

            // Check if there's an owner to reset
            if (!currentOwner) {
                await message.reply('❌ No group owner is currently set for this group!');
                return;
            }

            // Get group info for display
            const chat = await message.getChat();
            
            // Get owner info if possible
            let ownerInfo = 'Unknown User';
            try {
                const participants = chat.participants;
                const ownerParticipant = participants.find(p => p.id._serialized === currentOwner);
                if (ownerParticipant) {
                    ownerInfo = `@${ownerParticipant.id.user}`;
                }
            } catch (error) {
                console.log(chalk.yellow('⚠️ Could not get owner info for display'));
            }

            // If args contain 'confirm', proceed with reset
            if (args.length > 0 && args[0].toLowerCase() === 'confirm') {
                const success = await botInstance.ownerManager.removeOwner(groupId);

                if (success) {
                    let response = `🔄 *Group Owner Reset Successfully!*\n\n`;
                    response += `📋 *Group:* ${chat.name}\n`;
                    response += `👤 *Previous Owner:* ${ownerInfo}\n\n`;
                    response += `✅ *Changes Applied:*\n`;
                    response += `• Owner permissions removed\n`;
                    response += `• Group admins now have bot access\n`;
                    response += `• Owner privileges reset to default\n\n`;
                    response += `🤖 *Reset by ${config.botName}*`;

                    await message.reply(response);
                    console.log(chalk.yellow(`🔄 Owner reset for group ${groupId}`));
                } else {
                    await message.reply('❌ Failed to reset group owner. Please try again later.');
                }
            } else {
                // Show confirmation prompt
                await this.sendConfirmationPrompt(message, chat.name, ownerInfo);
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in ownerreset command:', error.message));
            await message.reply('❌ An error occurred while resetting the group owner. Please try again later.');
        }
    }

    /**
     * Send confirmation prompt for owner reset
     * @param {Object} message - WhatsApp message object
     * @param {String} groupName - Name of the group
     * @param {String} ownerInfo - Current owner info
     */
    async sendConfirmationPrompt(message, groupName, ownerInfo) {
        let confirmMsg = `⚠️ *Owner Reset Confirmation*\n\n`;
        confirmMsg += `📋 *Group:* ${groupName}\n`;
        confirmMsg += `👤 *Current Owner:* ${ownerInfo}\n\n`;
        confirmMsg += `🔄 *This will:*\n`;
        confirmMsg += `• Remove current owner permissions\n`;
        confirmMsg += `• Reset bot access to group admins only\n`;
        confirmMsg += `• Clear all owner privileges\n\n`;
        confirmMsg += `⚡ *To confirm, type:*\n`;
        confirmMsg += `\`.ownerreset confirm\`\n\n`;
        confirmMsg += `❌ *To cancel, ignore this message*\n\n`;
        confirmMsg += `💡 *Note:* This action cannot be undone. You'll need to set a new owner manually.`;

        await message.reply(confirmMsg);
    }
}

module.exports = OwnerResetCommand;