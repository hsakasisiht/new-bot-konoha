const chalk = require('chalk');
const config = require('../config');

class AuthDriveCommand {
    constructor() {
        this.name = 'authdrive';
        this.description = config.commands.authdrive.description;
        this.enabled = config.commands.authdrive.enabled;
        this.usage = '.authdrive [step] [code]';
        this.groupOnly = false;
        this.ownerOnly = false;
    }

    /**
     * Execute the authdrive command
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
                await message.reply('❌ Only the bot owner can authenticate Google Drive!');
                return;
            }

            console.log(chalk.green(`✅ Bot owner authenticating Google Drive: ${senderId}`));

            // Check if Google Drive manager exists
            if (!botInstance.googleDriveManager) {
                await message.reply('❌ Google Drive manager is not available!');
                return;
            }

            if (args.length === 0) {
                await this.sendHelp(message);
                return;
            }

            const step = args[0].toLowerCase();

            if (step === 'url' || step === '1') {
                await this.getAuthUrl(message, botInstance);
            } else if (step === 'code' || step === '2') {
                if (args.length < 2) {
                    await message.reply('❌ Please provide the authorization code!\n\nUsage: `.authdrive code [your_auth_code]`');
                    return;
                }
                const authCode = args.slice(1).join(' '); // Join in case code has spaces
                await this.setAuthCode(message, authCode, botInstance);
            } else if (step === 'status') {
                await this.checkStatus(message, botInstance);
            } else {
                await this.sendHelp(message);
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in authdrive command:', error.message));
            await message.reply('❌ An error occurred during Google Drive authentication. Please try again later.');
        }
    }

    /**
     * Get authorization URL
     */
    async getAuthUrl(message, botInstance) {
        try {
            // Initialize OAuth client if needed
            const credentials = require('../../config/google-credentials.json');
            const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
            
            if (!botInstance.googleDriveManager.auth) {
                const { google } = require('googleapis');
                botInstance.googleDriveManager.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            }

            const authUrl = botInstance.googleDriveManager.getAuthUrl();
            
            if (authUrl) {
                let response = `🔐 *Google Drive Authentication - Step 1*\n\n`;
                response += `📱 **Instructions:**\n`;
                response += `1. Click the link below\n`;
                response += `2. Sign in to your Google account\n`;
                response += `3. Grant permissions to access Google Drive\n`;
                response += `4. Copy the authorization code\n`;
                response += `5. Send: \`.authdrive code [your_code]\`\n\n`;
                response += `🔗 **Authorization URL:**\n${authUrl}\n\n`;
                response += `⚠️ **Important:** Keep this code private!`;
                
                await message.reply(response);
            } else {
                await message.reply('❌ Failed to generate authorization URL. Please check Google Drive credentials.');
            }
        } catch (error) {
            console.error(chalk.red('❌ Error getting auth URL:', error.message));
            await message.reply('❌ Failed to get authorization URL. Please check your Google Drive credentials file.');
        }
    }

    /**
     * Set authorization code
     */
    async setAuthCode(message, code, botInstance) {
        await message.reply('🔄 Processing authorization code...');
        
        const success = await botInstance.googleDriveManager.setAuthCode(code);
        
        if (success) {
            let response = `✅ *Google Drive Authentication Complete!*\n\n`;
            response += `🎉 **Success:** Google Drive is now connected\n`;
            response += `🔄 **Auto-fetch:** System is now enabled\n`;
            response += `📁 **Ready:** You can now use folder monitoring commands\n\n`;
            response += `💡 **Next Steps:**\n`;
            response += `• Use \`.setfolder [drive_id] [chat_id] [nickname]\` to set up monitoring\n`;
            response += `• Use \`.showfolders\` to see active monitors`;
            
            await message.reply(response);
            
            // Re-initialize Google Drive
            try {
                await botInstance.googleDriveManager.initialize();
                if (botInstance.autoFetchManager) {
                    await botInstance.autoFetchManager.initialize(botInstance.googleDriveManager, client);
                }
            } catch (error) {
                console.error(chalk.red('❌ Error re-initializing Google Drive:', error.message));
            }
        } else {
            await message.reply('❌ Failed to authenticate with Google Drive. Please check the authorization code and try again.');
        }
    }

    /**
     * Check authentication status
     */
    async checkStatus(message, botInstance) {
        const isConfigured = botInstance.googleDriveManager.isConfigured();
        const hasCredentials = require('fs').existsSync('./config/google-credentials.json');
        const hasToken = require('fs').existsSync('./config/google-token.json');
        
        let response = `📊 *Google Drive Status*\n\n`;
        response += `📄 **Credentials:** ${hasCredentials ? '✅ Found' : '❌ Missing'}\n`;
        response += `🔐 **Token:** ${hasToken ? '✅ Found' : '❌ Missing'}\n`;
        response += `⚙️ **Configured:** ${isConfigured ? '✅ Ready' : '❌ Not Ready'}\n`;
        response += `🔄 **Auto-fetch:** ${isConfigured ? '✅ Enabled' : '❌ Disabled'}\n\n`;
        
        if (!hasCredentials) {
            response += `⚠️ **Missing:** Google Drive credentials file\n`;
            response += `📁 **Location:** config/google-credentials.json\n\n`;
        }
        
        if (!hasToken) {
            response += `🔐 **Authentication Required:**\n`;
            response += `1. Use \`.authdrive url\` to get auth link\n`;
            response += `2. Use \`.authdrive code [code]\` to complete setup`;
        } else {
            response += `✅ **Ready to use Google Drive commands!**`;
        }
        
        await message.reply(response);
    }

    /**
     * Send help message
     */
    async sendHelp(message) {
        let help = `🔐 *Google Drive Authentication Help*\n\n`;
        help += `**Commands:**\n`;
        help += `• \`.authdrive url\` - Get authorization URL\n`;
        help += `• \`.authdrive code [code]\` - Set authorization code\n`;
        help += `• \`.authdrive status\` - Check authentication status\n\n`;
        help += `**Setup Process:**\n`;
        help += `1. \`.authdrive url\` - Get Google auth URL\n`;
        help += `2. Visit the URL and authorize the app\n`;
        help += `3. \`.authdrive code [your_code]\` - Complete setup\n\n`;
        help += `**Requirements:**\n`;
        help += `• Google Drive credentials in config/google-credentials.json\n`;
        help += `• Bot owner permissions`;
        
        await message.reply(help);
    }
}

module.exports = AuthDriveCommand;