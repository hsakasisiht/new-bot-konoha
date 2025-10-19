const chalk = require('chalk');
const config = require('../config');

/**
 * OwnerSet Command
 * Sets a group owner who has full bot access
 */
class OwnerSetCommand {
    constructor() {
        this.name = 'ownerset';
        this.description = config.commands.ownerset.description;
        this.enabled = config.commands.ownerset.enabled;
        this.groupOnly = config.commands.ownerset.groupOnly;
        this.adminOnly = config.commands.ownerset.adminOnly;
    }

    /**
     * Execute the ownerset command
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
                await message.reply('❌ Only the bot owner can set group owners!');
                console.log(chalk.yellow(`⚠️ Unauthorized ownerset attempt by ${senderId}`));
                return;
            }

            console.log(chalk.green(`✅ Bot owner verified: ${senderId}`));

            const groupId = message.from;

            // If no arguments, show help
            if (args.length === 0) {
                await this.sendOwnerSetHelp(message);
                return;
            }

            // Check if message has mentions
            const mentions = await message.getMentions();
            
            if (mentions.length === 0) {
                await message.reply('❌ Please mention a user to set as owner!\n\n📝 *Usage:* `.ownerset @username`');
                return;
            }

            if (mentions.length > 1) {
                await message.reply('❌ Please mention only one user to set as owner!');
                return;
            }

            const newOwnerId = mentions[0].id._serialized;
            const newOwnerNumber = mentions[0].number;

            // Check if the mentioned user is in the group
            const chat = await message.getChat();
            const participants = chat.participants;
            const isParticipant = participants.some(p => p.id._serialized === newOwnerId);

            if (!isParticipant) {
                await message.reply('❌ The mentioned user is not a member of this group!');
                return;
            }

            // Check if there's already an owner
            const currentOwner = botInstance.ownerManager.getOwner(groupId);
            
            if (currentOwner === newOwnerId) {
                await message.reply('❌ This user is already the group owner!');
                return;
            }

            // Set the new owner
            const success = await botInstance.ownerManager.setOwner(groupId, newOwnerId);

            if (success) {
                let response = `👑 *Group Owner Set Successfully!*\n\n`;
                response += `📋 *Group:* ${chat.name}\n`;
                response += `👤 *New Owner:* @${newOwnerNumber}\n\n`;
                response += `✅ *Permissions Granted:*\n`;
                response += `• Full bot access in this group\n`;
                response += `• Can use all commands\n`;
                response += `• Bot management privileges\n\n`;
                
                if (currentOwner) {
                    response += `⚠️ *Previous owner permissions removed*\n\n`;
                }
                
                response += `🤖 *Set by ${config.botName}*`;

                await message.reply(response, undefined, { mentions: [mentions[0]] });
                console.log(chalk.green(`👑 Owner set: ${newOwnerId} in group ${groupId}`));
            } else {
                await message.reply('❌ Failed to set group owner. Please try again later.');
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in ownerset command:', error.message));
            await message.reply('❌ An error occurred while setting the group owner. Please try again later.');
        }
    }

    /**
     * Send help for ownerset command
     * @param {Object} message - WhatsApp message object
     */
    async sendOwnerSetHelp(message) {
        let helpMsg = `👑 *Owner Set Command Help*\n\n`;
        helpMsg += `🎯 *Purpose:* Set a group owner with full bot access\n\n`;
        helpMsg += `📋 *Usage:* \`.ownerset @username\`\n\n`;
        helpMsg += `🔐 *Requirements:*\n`;
        helpMsg += `• Must be the bot owner\n`;
        helpMsg += `• Can only be used in groups\n`;
        helpMsg += `• Mentioned user must be in group\n\n`;
        helpMsg += `✅ *Owner Privileges:*\n`;
        helpMsg += `• Full access to all bot commands\n`;
        helpMsg += `• Bot management permissions\n`;
        helpMsg += `• Override restrictions\n\n`;
        helpMsg += `📝 *Example:*\n`;
        helpMsg += `\`.ownerset @john\` - Sets @john as group owner\n\n`;
        helpMsg += `💡 *Note:* Only one owner per group. Setting a new owner removes the previous one.\n\n`;
        helpMsg += `🤖 *Bot Owner Only:* This command can only be used by the authorized bot owner.`;

        await message.reply(helpMsg);
    }
}

module.exports = OwnerSetCommand;