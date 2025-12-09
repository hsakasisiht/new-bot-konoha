const chalk = require('chalk');
const config = require('../config');

/**
 * Broadcast Command
 * Sends a message to all groups the bot is in (Bot Owner Only)
 */
class BroadcastCommand {
    constructor() {
        this.name = 'broadcast';
        this.description = config.commands.broadcast.description;
        this.enabled = config.commands.broadcast.enabled;
    }

    /**
     * Execute the broadcast command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            const senderId = message.author || message.from;

            // Check if sender is bot owner
            if (!botInstance.ownerManager.isBotOwner(senderId)) {
                console.log(chalk.yellow(`⚠️ Unauthorized broadcast attempt by ${senderId}`));
                await message.reply('❌ *Access Denied*\n\nOnly the bot owner can use this command.');
                return;
            }

            // Check if message is provided
            if (args.length === 0) {
                await message.reply('❌ Please provide a message to broadcast!\n\n📝 *Usage:* `.broadcast <message>`');
                return;
            }

            const broadcastMessage = args.join(' ');
            const formattedMessage = `📢 *BROADCAST MESSAGE*\n\n${broadcastMessage}\n\n🤖 *Sent by ${config.botName}*`;

            await message.reply('🔄 *Processing Broadcast...*\n\nFetching groups and sending messages. This may take a moment.');

            // Get all chats
            const chats = await client.getChats();
            
            // Filter for groups
            const groups = chats.filter(chat => chat.isGroup);
            
            if (groups.length === 0) {
                await message.reply('❌ No groups found to broadcast to.');
                return;
            }

            console.log(chalk.blue(`📢 Starting broadcast to ${groups.length} groups...`));

            let successCount = 0;
            let failCount = 0;

            // Send to all groups
            for (const group of groups) {
                try {
                    await group.sendMessage(formattedMessage);
                    successCount++;
                    // Add a small delay to prevent spam detection
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    console.error(chalk.red(`❌ Failed to send to group ${group.name}: ${err.message}`));
                    failCount++;
                }
            }

            const summary = `✅ *Broadcast Complete*\n\n` +
                          `📤 *Sent:* ${successCount}\n` +
                          `❌ *Failed:* ${failCount}\n` +
                          `👥 *Total Groups:* ${groups.length}`;

            await message.reply(summary);
            console.log(chalk.green(`✅ Broadcast complete. Sent: ${successCount}, Failed: ${failCount}`));

        } catch (error) {
            console.error(chalk.red('❌ Error in broadcast command:', error.message));
            await message.reply('❌ An error occurred while broadcasting.');
        }
    }
}

module.exports = BroadcastCommand;
