const fs = require('fs-extra');
const chalk = require('chalk');
const config = require('./config');

/**
 * Auto-Fetch Manager
 * Automatically monitors Google Drive folders and sends latest Excel files to specific chats
 */
class AutoFetchManager {
    constructor() {
        this.googleDriveManager = null;
        this.client = null;
        this.mappingsFilePath = config.autoFetch.storageFile;
        this.checkInterval = config.autoFetch.checkInterval;
        this.retryInterval = config.autoFetch.retryInterval;
        this.maxRetries = config.autoFetch.maxRetries;
        
        // Map structure: folderId -> { chatId, nickname, lastFileId, lastCheck, isActive, retryCount }
        this.mappings = new Map();
        this.intervals = new Map(); // Store interval IDs for each folder
        this.isRunning = false;
        
        this.init();
    }

    /**
     * Initialize the auto-fetch system with Google Drive manager and client
     * @param {Object} googleDriveManager - Google Drive manager instance
     * @param {Object} client - WhatsApp client instance
     */
    async initialize(googleDriveManager, client) {
        this.googleDriveManager = googleDriveManager;
        this.client = client;
        console.log(chalk.green('🔄 Auto-fetch manager initialized with Google Drive and WhatsApp client'));
        
        // Start monitoring existing mappings now that we have Google Drive
        if (this.mappings.size > 0) {
            await this.startAllMonitoring();
        }
    }

    /**
     * Initialize the auto-fetch system
     */
    async init() {
        try {
            await this.loadMappings();
            console.log(chalk.green('🔄 Auto-fetch system initialized'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize auto-fetch:', error.message));
        }
    }

    /**
     * Load mappings from storage file
     */
    async loadMappings() {
        try {
            if (await fs.pathExists(this.mappingsFilePath)) {
                const data = await fs.readJson(this.mappingsFilePath);
                this.mappings = new Map(Object.entries(data));
                console.log(chalk.cyan(`📂 Loaded ${this.mappings.size} auto-fetch mappings`));
                
                // Note: Don't start monitoring here - will be started after initialization
            } else {
                await this.saveMappings();
                console.log(chalk.yellow('📝 Created new auto-fetch mappings file'));
            }
        } catch (error) {
            console.error(chalk.red('❌ Error loading auto-fetch mappings:', error.message));
            this.mappings = new Map();
        }
    }

    /**
     * Save mappings to storage file
     */
    async saveMappings() {
        try {
            const mappingsObject = Object.fromEntries(this.mappings);
            await fs.ensureFile(this.mappingsFilePath);
            await fs.writeJson(this.mappingsFilePath, mappingsObject, { spaces: 2 });
            console.log(chalk.green('💾 Auto-fetch mappings saved'));
        } catch (error) {
            console.error(chalk.red('❌ Error saving auto-fetch mappings:', error.message));
        }
    }

    /**
     * Add a new auto-fetch mapping
     * @param {String} folderId - Google Drive folder ID
     * @param {String} chatId - WhatsApp chat ID
     * @param {String} nickname - Nickname for the mapping
     * @returns {Boolean} Success status
     */
    async addMapping(folderId, chatId, nickname = null) {
        try {
            // Check if folder is already being monitored
            if (this.mappings.has(folderId)) {
                return { success: false, error: 'Folder is already being monitored' };
            }

            // Validate folder access
            if (!await this.googleDriveManager.validateFolder(folderId)) {
                return { success: false, error: 'Cannot access the specified folder' };
            }

            // Get initial latest file - but don't set as lastFileId so it will be sent immediately
            const latestFile = await this.googleDriveManager.getLatestExcelFile(folderId);
            
            const mapping = {
                chatId: chatId,
                nickname: nickname || `auto_${folderId.substring(0, 8)}`,
                lastFileId: null, // Set to null so first file will be sent
                lastFileName: latestFile ? latestFile.name : null,
                lastCheck: new Date().toISOString(),
                addedAt: new Date().toISOString(),
                isActive: true,
                retryCount: 0,
                sendFirstFile: true // Flag to indicate we should send the first file found
            };

            this.mappings.set(folderId, mapping);
            await this.saveMappings();

            // Start monitoring this folder
            await this.startMonitoring(folderId);

            console.log(chalk.green(`🔄 Auto-fetch mapping added: ${folderId} -> ${chatId}`));
            return { success: true };

        } catch (error) {
            console.error(chalk.red('❌ Error adding auto-fetch mapping:', error.message));
            return { success: false, error: error.message };
        }
    }

    /**
     * Remove an auto-fetch mapping
     * @param {String} folderId - Google Drive folder ID
     * @returns {Boolean} Success status
     */
    async removeMapping(folderId) {
        try {
            // Stop monitoring
            this.stopMonitoring(folderId);

            // Remove mapping
            const removed = this.mappings.delete(folderId);
            if (removed) {
                await this.saveMappings();
                console.log(chalk.yellow(`🔄 Auto-fetch mapping removed: ${folderId}`));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red('❌ Error removing auto-fetch mapping:', error.message));
            return false;
        }
    }

    /**
     * Start monitoring a specific folder
     * @param {String} folderId - Google Drive folder ID
     */
    async startMonitoring(folderId) {
        // Clear existing interval if any
        if (this.intervals.has(folderId)) {
            clearInterval(this.intervals.get(folderId));
        }

        const mapping = this.mappings.get(folderId);
        if (!mapping || !mapping.isActive) {
            return;
        }

        console.log(chalk.cyan(`🔄 Starting auto-fetch monitoring for folder: ${folderId}`));

        // Set up interval for this folder
        const intervalId = setInterval(async () => {
            await this.checkFolder(folderId);
        }, this.checkInterval);

        this.intervals.set(folderId, intervalId);

        // Do an immediate check after a short delay
        setTimeout(() => {
            this.checkFolder(folderId);
        }, 2000); // Wait 2 seconds after bot start
    }

    /**
     * Stop monitoring a specific folder
     * @param {String} folderId - Google Drive folder ID
     */
    stopMonitoring(folderId) {
        if (this.intervals.has(folderId)) {
            clearInterval(this.intervals.get(folderId));
            this.intervals.delete(folderId);
            console.log(chalk.yellow(`🔄 Stopped monitoring folder: ${folderId}`));
        }
    }

    /**
     * Start monitoring all active mappings
     */
    async startAllMonitoring() {
        if (!this.googleDriveManager || !this.googleDriveManager.isConfigured()) {
            console.log(chalk.yellow('⚠️ Google Drive not configured, auto-fetch monitoring disabled'));
            return;
        }

        console.log(chalk.green('🔄 Starting auto-fetch monitoring for all folders'));
        this.isRunning = true;

        for (const [folderId, mapping] of this.mappings) {
            if (mapping.isActive) {
                await this.startMonitoring(folderId);
            }
        }
    }

    /**
     * Stop all monitoring
     */
    stopAllMonitoring() {
        console.log(chalk.yellow('🔄 Stopping all auto-fetch monitoring'));
        this.isRunning = false;

        for (const [folderId] of this.intervals) {
            this.stopMonitoring(folderId);
        }
    }

    /**
     * Check a specific folder for new files
     * @param {String} folderId - Google Drive folder ID
     */
    async checkFolder(folderId) {
        const mapping = this.mappings.get(folderId);
        if (!mapping || !mapping.isActive) {
            return;
        }

        try {
            console.log(chalk.cyan(`🔍 Checking folder ${folderId} for new files...`));

            // Get latest file from folder
            const latestFile = await this.googleDriveManager.getLatestExcelFile(folderId);
            
            if (!latestFile) {
                console.log(chalk.yellow(`⚠️ No Excel files found in folder: ${folderId}`));
                mapping.lastCheck = new Date().toISOString();
                mapping.retryCount = 0; // Reset retry count
                await this.saveMappings();
                return;
            }

            // Check if this is a new file or first-time setup
            const isNewFile = mapping.lastFileId !== latestFile.id;
            const shouldSendFirstFile = mapping.sendFirstFile && mapping.lastFileId === null;
            
            if (isNewFile || shouldSendFirstFile) {
                if (shouldSendFirstFile) {
                    console.log(chalk.green(`📄 Sending latest file on first setup: ${latestFile.name}`));
                } else {
                    console.log(chalk.green(`📄 New file detected: ${latestFile.name}`));
                }

                // Download and send the file
                const success = await this.sendFileToChat(folderId, latestFile, mapping);
                
                if (success) {
                    // Update mapping with new file info
                    mapping.lastFileId = latestFile.id;
                    mapping.lastFileName = latestFile.name;
                    mapping.lastCheck = new Date().toISOString();
                    mapping.retryCount = 0;
                    mapping.sendFirstFile = false; // Clear first file flag
                    await this.saveMappings();
                    
                    console.log(chalk.green(`✅ Successfully sent ${latestFile.name} to ${mapping.chatId} (${mapping.nickname})`));
                } else {
                    // Handle retry logic
                    mapping.retryCount = (mapping.retryCount || 0) + 1;
                    if (mapping.retryCount >= this.maxRetries) {
                        console.log(chalk.red(`❌ Max retries reached for folder ${folderId}, pausing monitoring`));
                        mapping.isActive = false;
                        this.stopMonitoring(folderId);
                    }
                    await this.saveMappings();
                }
            } else {
                // No new file, just update check time
                mapping.lastCheck = new Date().toISOString();
                mapping.retryCount = 0;
                await this.saveMappings();
                console.log(chalk.gray(`📁 No new files in folder: ${folderId}`));
            }

        } catch (error) {
            console.error(chalk.red(`❌ Error checking folder ${folderId}:`, error.message));
            
            // Handle error retry logic
            mapping.retryCount = (mapping.retryCount || 0) + 1;
            if (mapping.retryCount >= this.maxRetries) {
                console.log(chalk.red(`❌ Max retries reached for folder ${folderId}, pausing monitoring`));
                mapping.isActive = false;
                this.stopMonitoring(folderId);
            }
            await this.saveMappings();
        }
    }

    /**
     * Send file to chat
     * @param {String} folderId - Google Drive folder ID
     * @param {Object} file - File object from Google Drive
     * @param {Object} mapping - Mapping configuration
     * @returns {Boolean} Success status
     */
    async sendFileToChat(folderId, file, mapping) {
        try {
            // Download file
            const downloadDir = './temp/excel';
            const fileName = `autofetch_${Date.now()}_${file.name}`;
            const filePath = require('path').join(downloadDir, fileName);

            console.log(chalk.cyan(`📥 Auto-downloading: ${file.name}`));
            const downloadSuccess = await this.googleDriveManager.downloadFile(file.id, filePath);
            
            if (!downloadSuccess) {
                console.error(chalk.red('❌ Failed to download file for auto-fetch'));
                return false;
            }

            // Send to chat using WhatsApp Web.js MessageMedia
            const MessageMedia = require('whatsapp-web.js').MessageMedia;
            const media = MessageMedia.fromFilePath(filePath);
            
            const caption = `📊 *Auto-Delivered Excel File*\n\n📁 *File:* ${file.name}\n📅 *Modified:* ${new Date(file.modifiedTime).toLocaleString()}\n🔄 *Auto-Fetch:* ${mapping.nickname}\n📂 *Folder:* \`${folderId.substring(0, 12)}...\`\n🤖 *Delivered by ${config.botName}*`;
            
            await this.client.sendMessage(mapping.chatId, media, { caption });

            // Clean up
            await fs.remove(filePath);

            console.log(chalk.green(`✅ Auto-sent ${file.name} to ${mapping.chatId}`));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ Error sending auto-fetch file:', error.message));
            return false;
        }
    }

    /**
     * Get all mappings
     * @returns {Map} All auto-fetch mappings
     */
    getAllMappings() {
        return new Map(this.mappings);
    }

    /**
     * Get mapping count
     * @returns {Number} Number of active mappings
     */
    getMappingCount() {
        return Array.from(this.mappings.values()).filter(m => m.isActive).length;
    }

    /**
     * Get active mappings count
     * @returns {Number} Number of active mappings
     */
    getActiveMappingsCount() {
        return Array.from(this.mappings.values()).filter(m => m.isActive).length;
    }

    /**
     * Get formatted mapping list
     * @returns {String} Formatted list of mappings
     */
    getFormattedMappingList() {
        const activeMappings = Array.from(this.mappings.entries()).filter(([, mapping]) => mapping.isActive);
        
        if (activeMappings.length === 0) {
            return `🔄 *Auto-Fetch Mappings:*\n\n❌ No active auto-fetch mappings configured.\n\n💡 Use \`.setfolder [drive_id] [chat_id]\` to set up automatic Excel delivery.`;
        }

        let list = `🔄 *Auto-Fetch Mappings:*\n\n`;
        let index = 1;

        activeMappings.forEach(([folderId, mapping]) => {
            list += `${index}. *${mapping.nickname}*\n`;
            list += `   📁 Folder: \`${folderId}\`\n`;
            list += `   💬 Chat: \`${mapping.chatId}\`\n`;
            list += `   📄 Last File: ${mapping.lastFileName || 'None'}\n`;
            list += `   🕐 Last Check: ${new Date(mapping.lastCheck).toLocaleString()}\n`;
            list += `   ✅ Status: ${mapping.isActive ? 'Active' : 'Paused'}\n\n`;
            index++;
        });

        list += `⏱️ *Check Interval:* ${Math.round(this.checkInterval / 60000)} minutes\n`;
        list += `🔄 *Active Monitors:* ${this.intervals.size}`;

        return list;
    }

    /**
     * Toggle monitoring for a specific folder
     * @param {String} folderId - Google Drive folder ID
     * @param {Boolean} active - Whether to activate or deactivate
     * @returns {Boolean} Success status
     */
    async toggleMonitoring(folderId, active) {
        const mapping = this.mappings.get(folderId);
        if (!mapping) {
            return false;
        }

        mapping.isActive = active;
        if (active) {
            mapping.retryCount = 0;
            await this.startMonitoring(folderId);
        } else {
            this.stopMonitoring(folderId);
        }

        await this.saveMappings();
        return true;
    }
}

module.exports = AutoFetchManager;