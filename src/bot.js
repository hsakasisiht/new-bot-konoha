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
        
        // Create readline interface for user input (only if not in PM2/headless mode)
        this.rl = null;
        this.isPM2 = process.env.PM2_HOME || process.env.NODE_APP_INSTANCE !== undefined;
        this.isHeadless = !process.stdin.isTTY || this.isPM2;
        
        if (!this.isHeadless) {
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }
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
                    '--disable-gpu',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-features=TranslateUI',
                    '--disable-ipc-flooding-protection',
                    '--disable-web-security',
                    '--single-process',
                    '--disable-extensions',
                    '--disable-default-apps',
                    '--no-first-run',
                    '--disable-component-update',
                    '--disable-domain-reliability',
                    '--disable-sync',
                    '--metrics-recording-only',
                    '--no-crash-upload',
                    '--no-default-browser-check',
                    '--no-pings',
                    '--password-store=basic',
                    '--use-mock-keychain'
                ],
                executablePath: process.env.CHROME_BIN || undefined,
                timeout: 60000
            },
            // Increase timeouts to handle slower connections
            takeoverOnConflict: true,
            takeoverTimeoutMs: 60000
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
            if (this.isHeadless || this.isPM2) {
                console.log(chalk.yellow('📱 QR Code for WhatsApp authentication:'));
                console.log(chalk.cyan('🔗 QR Code Data (use a QR code generator to display):'));
                console.log(chalk.gray(qr));
                console.log(chalk.blue('💡 Copy the QR data above to a QR code generator or use pairing code instead'));
            } else {
                console.log(chalk.yellow('📱 Scan this QR code with your WhatsApp:'));
                qrcode.generate(qr, { small: true });
            }
            console.log(chalk.cyan('Or use pairing code authentication (recommended for servers)'));
        });

        // Pairing code event (new authentication method)
        this.client.on('code', async (code) => {
            console.log(chalk.green.bold(`🔐 Pairing Code: ${code}`));
            console.log(chalk.yellow('Enter this code in WhatsApp > Linked Devices > Link a Device > Link with Phone Number'));
            if (this.isPM2) {
                console.log(chalk.blue('📋 PM2 Logs: Use "pm2 logs konoha-bot" to see this pairing code'));
            }
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
            
            // Show available commands (only in non-production or when startup logging is enabled)
            if (!config.production || config.logging.showStartup) {
                const commands = this.commandHandler.getCommandInfo();
                console.log(chalk.cyan('\n📋 Available Commands:'));
                commands.forEach(cmd => {
                    const groupInfo = cmd.groupOnly ? ' (Groups only)' : '';
                    console.log(chalk.cyan(`  ${cmd.name} - ${cmd.description}${groupInfo}`));
                });
            }
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
                this.handleReconnection();
            }
        });

        // Handle loading screen
        this.client.on('loading_screen', (percent, message) => {
            console.log(chalk.blue(`📱 Loading: ${percent}% - ${message}`));
        });

        // Handle state changes
        this.client.on('change_state', (state) => {
            console.log(chalk.blue(`📱 State changed: ${state}`));
        });

        // Add global error handler for unhandled promise rejections
        process.on('unhandledRejection', (error) => {
            if (error.message && error.message.includes('Execution context was destroyed')) {
                console.log(chalk.yellow('⚠️ Execution context destroyed - this is normal during navigation'));
                console.log(chalk.blue('🔄 WhatsApp is refreshing, bot will continue working...'));
                return;
            }
            console.error(chalk.red('❌ Unhandled promise rejection:', error));
        });

        // Handle process termination gracefully
        process.on('SIGINT', () => {
            console.log(chalk.yellow('\n🛑 Received SIGINT - shutting down gracefully...'));
            this.shutdown();
        });

        process.on('SIGTERM', () => {
            console.log(chalk.yellow('\n🛑 Received SIGTERM - shutting down gracefully...'));
            this.shutdown();
        });

        // Message creation (sent by bot)
        this.client.on('message_create', (message) => {
            // Only log command responses or when verbose logging is enabled
            if (message.fromMe && message.body && config.logging.verboseMessages) {
                console.log(chalk.gray(`📤 Sent: ${message.body}`));
            }
        });
    }

    /**
     * Handle authentication failure
     */
    async handleAuthFailure() {
        console.log(chalk.yellow('🔄 Cleaning up session and retrying...'));
        try {
            await this.sessionManager.clearSession();
            
            if (this.isHeadless || this.isPM2) {
                // In PM2/headless mode, automatically retry without user input
                console.log(chalk.blue('🔄 Running in headless mode - automatically retrying authentication...'));
                console.log(chalk.yellow('💡 Please scan QR code or use pairing code when prompted'));
                setTimeout(async () => {
                    await this.initializeClient();
                }, 3000);
            } else {
                // Interactive mode - ask user
                this.rl.question(chalk.blue('❓ Do you want to retry authentication? (y/n): '), async (answer) => {
                    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                        await this.initializeClient();
                    } else {
                        console.log(chalk.red('👋 Goodbye!'));
                        process.exit(0);
                    }
                });
            }
        } catch (error) {
            console.error(chalk.red('❌ Error during auth failure handling:', error.message));
            process.exit(1);
        }
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
        if (config.production) {
            console.log(chalk.green.bold('🍃 Konoha Bot Starting...'));
            console.log(chalk.blue(`🚀 Mode: Production | Started: ${moment().format('YYYY-MM-DD HH:mm:ss')}`));
            if (this.isPM2) {
                console.log(chalk.cyan('⚙️ Process Manager: PM2 Detected'));
            }
            if (this.isHeadless) {
                console.log(chalk.yellow('🖥️ Running in headless mode - QR code/pairing will be logged'));
            }
        } else {
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
        }

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
     * Handle authentication failure
     */
    async handleAuthFailure() {
        console.log(chalk.yellow('🔄 Cleaning up session and retrying...'));
        try {
            await this.sessionManager.clearSession();
            console.log(chalk.blue('🔄 Please restart the bot to try authentication again'));
            process.exit(1);
        } catch (error) {
            console.error(chalk.red('❌ Error during auth failure handling:', error.message));
            process.exit(1);
        }
    }

    /**
     * Handle reconnection after navigation/context destruction
     */
    async handleReconnection() {
        console.log(chalk.blue('🔄 Handling reconnection...'));
        // Don't restart the client, just wait for it to recover
        setTimeout(() => {
            if (!this.isReady) {
                console.log(chalk.yellow('⚠️ Client not ready after reconnection attempt'));
            }
        }, 10000); // Wait 10 seconds to check if client recovers
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