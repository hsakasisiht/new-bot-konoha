const config = require('../config');

/**
 * Ping Command
 * Shows bot status, response time, and uptime
 */
class PingCommand {
    constructor() {
        this.name = 'ping';
        this.description = config.commands.ping.description;
        this.enabled = config.commands.ping.enabled;
        this.groupOnly = false;
    }

    /**
     * Execute the ping command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance for status
     */
    async execute(message, args, client, botInstance) {
        const startTime = Date.now();
        
        // Get bot status
        const botStatus = botInstance ? botInstance.getStatus() : { uptime: 'Unknown' };
        
        const reply = await message.reply(`${config.messages.pong}\n\n✅ Status: Active\n🏓 Ping: Calculating...\n⏰ Uptime: ${botStatus.uptime}`);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Edit the message to include actual response time
        setTimeout(async () => {
            try {
                await reply.edit(`${config.messages.pong}\n\n✅ Status: Active\n🏓 Ping: ${responseTime}ms\n⏰ Uptime: ${botStatus.uptime}`);
            } catch (error) {
                // If edit fails, send a new message
                await message.reply(`✅ Status: Active\n🏓 Ping: ${responseTime}ms\n⏰ Uptime: ${botStatus.uptime}`);
            }
        }, 100);
    }
}

module.exports = PingCommand;