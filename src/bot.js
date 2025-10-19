const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chalk = require('chalk');
const readline = require('readline');
const moment = require('moment');

const config = require('./config');
const SessionManager = require('./sessionManager');
const CommandHandler = require('./commandHandler');
const OwnerManager = require('./ownerManager');
const GoogleDriveManager = require('./googleDriveManager');
const ContactManager = require('./contactManager');
const FolderMappingManager = require('./folderMappingManager');
const AutoFetchManager = require('./autoFetchManager');

class KonohaBot {
    constructor() {
        this.sessionManager = new SessionManager();
        this.ownerManager = new OwnerManager();
        this.googleDriveManager = new GoogleDriveManager();
        this.contactManager = new ContactManager();
        this.folderMappingManager = new FolderMappingManager();
        this.autoFetchManager = new AutoFetchManager();
        this.client = null;
        this.commandHandler = null;
        this.isReady = false;
        this.startTime = moment();
        
        // Create readline interface for user input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * Initialize the WhatsApp client
     */
    async initializeClient() {
        console.log(chalk.blue.bold('🚀 Initializing Konoha WhatsApp Bot...'));
        
        // Initialize client with LocalAuth for session management
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: config.sessionName,
                dataPath: config.sessionPath
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        this.setupEventHandlers();
        
        try {
            await this.client.initialize();
        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize client:', error.message));
            process.exit(1);
        }
    }

    /**
     * Setup event handlers for the WhatsApp client
     */
    setupEventHandlers() {
        // QR Code generation (for first-time authentication)
        this.client.on('qr', (qr) => {
            console.log(chalk.yellow('📱 Scan this QR code with your WhatsApp:'));
            qrcode.generate(qr, { small: true });
            console.log(chalk.cyan('Or use pairing code authentication (recommended)'));
        });

        // Pairing code event (new authentication method)
        this.client.on('code', async (code) => {
            console.log(chalk.green.bold(`🔐 Pairing Code: ${code}`));
            console.log(chalk.yellow('Enter this code in WhatsApp > Linked Devices > Link a Device > Link with Phone Number'));
        });

        // Authentication success
        this.client.on('authenticated', (session) => {
            console.log(chalk.green('✅ Authentication successful!'));
        });

        // Authentication failure
        this.client.on('auth_failure', (message) => {
            console.error(chalk.red('❌ Authentication failed:', message));
            this.handleAuthFailure();
        });

        // Client ready
        this.client.on('ready', async () => {
            this.isReady = true;
            const info = this.client.info;
            console.log(chalk.green.bold(`🤖 ${config.botName} is ready!`));
            console.log(chalk.blue(`📱 Connected as: ${info.pushname} (${info.wid.user})`));
            console.log(chalk.blue(`⏰ Started at: ${this.startTime.format('YYYY-MM-DD HH:mm:ss')}`));
            
            // Initialize Google Drive (optional, don't fail if not configured)
            try {
                await this.googleDriveManager.initialize();
                
                // Initialize AutoFetchManager if Google Drive is configured
                await this.autoFetchManager.initialize(this.googleDriveManager, this.client);
                console.log(chalk.green('🔄 Auto-fetch system initialized'));
                
                // Start monitoring all configured folders
                await this.autoFetchManager.startAllMonitoring();
                const activeCount = this.autoFetchManager.getActiveMappingsCount();
                if (activeCount > 0) {
                    console.log(chalk.green(`🎯 Started monitoring ${activeCount} folder(s) for auto-fetch`));
                } else {
                    console.log(chalk.yellow('📁 No folder mappings configured for auto-fetch'));
                }
            } catch (driveError) {
                console.log(chalk.yellow('⚠️ Google Drive initialization skipped:', driveError.message));
                console.log(chalk.yellow('⚠️ Auto-fetch system disabled - Google Drive required'));
            }
            
            // Initialize command handler
            this.commandHandler = new CommandHandler(this.client, this);
            
            // Show available commands
            const commands = this.commandHandler.getCommandInfo();
            console.log(chalk.cyan('\n📋 Available Commands:'));
            commands.forEach(cmd => {
                const groupInfo = cmd.groupOnly ? ' (Groups only)' : '';
                console.log(chalk.cyan(`  ${cmd.name} - ${cmd.description}${groupInfo}`));
            });
            console.log(chalk.green('\n✨ Bot is now listening for messages...\n'));
        });

        // Message received
        this.client.on('message', async (message) => {
            if (this.commandHandler) {
                await this.commandHandler.handleMessage(message);
            }
        });

        // Connection lost
        this.client.on('disconnected', (reason) => {
            console.log(chalk.yellow('📱 Client disconnected:', reason));
            if (reason === 'NAVIGATION') {
                console.log(chalk.blue('🔄 Attempting to reconnect...'));
            }
        });

        // Message creation (sent by bot)
        this.client.on('message_create', (message) => {
            // Log messages sent by the bot
            if (message.fromMe && message.body) {
                console.log(chalk.gray(`📤 Sent: ${message.body}`));
            }
        });
    }

    /**
     * Handle authentication failure
     */
    async handleAuthFailure() {
        console.log(chalk.yellow('🔄 Attempting to clear session and retry...'));
        await this.sessionManager.deleteSession();
        
        this.rl.question(chalk.blue('❓ Do you want to retry authentication? (y/n): '), async (answer) => {
            if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                await this.restart();
            } else {
                console.log(chalk.red('👋 Goodbye!'));
                process.exit(0);
            }
        });
    }

    /**
     * Restart the bot
     */
    async restart() {
        console.log(chalk.blue('🔄 Restarting bot...'));
        if (this.client) {
            await this.client.destroy();
        }
        setTimeout(() => {
            this.initializeClient();
        }, 2000);
    }

    /**
     * Start the bot
     */
    async start() {
        console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════╗
║                    🍃 KONOHA BOT 🍃                   ║
║                                                      ║
║  WhatsApp Bot with Authentication & Session Management║
║                                                      ║
║  Features:                                           ║
║  🔐 Phone Number + Pairing Code Authentication       ║
║  💾 Session-based Login                              ║
║  👥 Tag All Members in Groups                        ║
║  🏓 Ping Command                                     ║
╚══════════════════════════════════════════════════════╝
        `));

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log(chalk.yellow('\n🛑 Received SIGINT, shutting down gracefully...'));
            await this.shutdown();
        });

        process.on('SIGTERM', async () => {
            console.log(chalk.yellow('\n🛑 Received SIGTERM, shutting down gracefully...'));
            await this.shutdown();
        });

        // Start the client
        await this.initializeClient();
    }

    /**
     * Shutdown the bot gracefully
     */
    async shutdown() {
        console.log(chalk.blue('🔄 Shutting down...'));
        
        if (this.client) {
            try {
                await this.client.destroy();
                console.log(chalk.green('✅ Client destroyed successfully'));
            } catch (error) {
                console.error(chalk.red('❌ Error destroying client:', error.message));
            }
        }
        
        if (this.rl) {
            this.rl.close();
        }
        
        const uptime = moment.duration(moment().diff(this.startTime));
        console.log(chalk.blue(`⏰ Bot was running for: ${uptime.humanize()}`));
        console.log(chalk.green('👋 Goodbye!'));
        process.exit(0);
    }

    /**
     * Get bot status
     */
    getStatus() {
        const uptime = moment.duration(moment().diff(this.startTime));
        return {
            ready: this.isReady,
            uptime: uptime.humanize(),
            startTime: this.startTime.format('YYYY-MM-DD HH:mm:ss')
        };
    }
}

// Create and start the bot
const bot = new KonohaBot();
bot.start().catch(error => {
    console.error(chalk.red('💥 Fatal error:', error.message));
    process.exit(1);
});

module.exports = KonohaBot;