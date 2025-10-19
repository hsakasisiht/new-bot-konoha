const fs = require('fs-extra');
const chalk = require('chalk');
const config = require('./config');

/**
 * Folder Mapping Manager
 * Maps Google Drive folders to specific WhatsApp chats
 */
class FolderMappingManager {
    constructor() {
        this.mappingsFilePath = config.folderMapping.storageFile;
        this.mappings = new Map(); // chatId -> { folderId, folderName, nickname, addedAt }
        this.defaultFolderId = config.folderMapping.defaultFolderId;
        this.init();
    }

    /**
     * Initialize the folder mapping system
     */
    async init() {
        try {
            await this.loadMappings();
            if (!config.production || config.logging.showStartup) {
                console.log(chalk.green('📁 Folder mapping system initialized'));
            }
        } catch (error) {
            if (config.logging.showErrors) {
                console.error(chalk.red('❌ Failed to initialize folder mapping system:', error.message));
            }
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
                if (!config.production || config.logging.showStartup) {
                    console.log(chalk.cyan(`📂 Loaded ${this.mappings.size} folder mappings`));
                }
            } else {
                // Create empty mappings file
                await this.saveMappings();
                if (!config.production || config.logging.showStartup) {
                    console.log(chalk.yellow('📝 Created new folder mappings file'));
                }
            }
        } catch (error) {
            if (config.logging.showErrors) {
                console.error(chalk.red('❌ Error loading mappings:', error.message));
            }
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
            console.log(chalk.green('💾 Folder mappings saved successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Error saving mappings:', error.message));
        }
    }

    /**
     * Set a folder mapping for a specific chat
     * @param {String} chatId - WhatsApp chat ID
     * @param {String} folderId - Google Drive folder ID
     * @param {String} folderName - Display name for the folder (optional)
     * @param {String} nickname - Nickname for easy reference (optional)
     * @returns {Boolean} Success status
     */
    async setMapping(chatId, folderId, folderName = null, nickname = null) {
        try {
            const mapping = {
                folderId: folderId,
                folderName: folderName || `Folder_${folderId.substring(0, 8)}`,
                nickname: nickname || chatId.substring(0, 12),
                addedAt: new Date().toISOString()
            };

            this.mappings.set(chatId, mapping);
            await this.saveMappings();
            
            console.log(chalk.green(`📁 Folder mapping set: ${chatId} -> ${folderId}`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Error setting mapping:', error.message));
            return false;
        }
    }

    /**
     * Remove a folder mapping
     * @param {String} chatId - WhatsApp chat ID
     * @returns {Boolean} Success status
     */
    async removeMapping(chatId) {
        try {
            const removed = this.mappings.delete(chatId);
            if (removed) {
                await this.saveMappings();
                console.log(chalk.yellow(`📁 Folder mapping removed: ${chatId}`));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red('❌ Error removing mapping:', error.message));
            return false;
        }
    }

    /**
     * Get folder ID for a specific chat
     * @param {String} chatId - WhatsApp chat ID
     * @returns {String} Folder ID or default folder ID
     */
    getFolderForChat(chatId) {
        const mapping = this.mappings.get(chatId);
        if (mapping) {
            console.log(chalk.cyan(`📁 Using mapped folder for ${chatId}: ${mapping.folderId}`));
            return mapping.folderId;
        }
        
        console.log(chalk.yellow(`📁 Using default folder for ${chatId}: ${this.defaultFolderId}`));
        return this.defaultFolderId;
    }

    /**
     * Get mapping details for a chat
     * @param {String} chatId - WhatsApp chat ID
     * @returns {Object|null} Mapping object or null
     */
    getMapping(chatId) {
        return this.mappings.get(chatId) || null;
    }

    /**
     * Check if a chat has a specific folder mapping
     * @param {String} chatId - WhatsApp chat ID
     * @returns {Boolean} True if mapping exists
     */
    hasMapping(chatId) {
        return this.mappings.has(chatId);
    }

    /**
     * Get all folder mappings
     * @returns {Map} Map of all mappings
     */
    getAllMappings() {
        return new Map(this.mappings);
    }

    /**
     * Get mapping count
     * @returns {Number} Number of mappings
     */
    getMappingCount() {
        return this.mappings.size;
    }

    /**
     * Update mapping information
     * @param {String} chatId - WhatsApp chat ID
     * @param {Object} updates - Updates to apply
     * @returns {Boolean} Success status
     */
    async updateMapping(chatId, updates) {
        try {
            const mapping = this.getMapping(chatId);
            if (!mapping) {
                return false;
            }

            // Apply updates
            Object.assign(mapping, updates);
            mapping.updatedAt = new Date().toISOString();

            this.mappings.set(chatId, mapping);
            await this.saveMappings();

            console.log(chalk.green(`📁 Mapping updated: ${chatId}`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Error updating mapping:', error.message));
            return false;
        }
    }

    /**
     * Set default folder ID
     * @param {String} folderId - Default Google Drive folder ID
     */
    setDefaultFolder(folderId) {
        this.defaultFolderId = folderId;
        console.log(chalk.green(`📁 Default folder set: ${folderId}`));
    }

    /**
     * Get formatted mapping list for display
     * @returns {String} Formatted mapping list
     */
    getFormattedMappingList() {
        if (this.mappings.size === 0) {
            return `📁 *Folder Mappings:*\n\n❌ No specific folder mappings configured.\n\n🔄 *Default Behavior:*\nAll chats use default folder: \`${this.defaultFolderId}\``;
        }

        let list = `📁 *Folder Mappings:*\n\n`;
        let index = 1;

        this.mappings.forEach((mapping, chatId) => {
            list += `${index}. *${mapping.nickname}*\n`;
            list += `   • Chat ID: \`${chatId}\`\n`;
            list += `   • Folder: ${mapping.folderName}\n`;
            list += `   • Folder ID: \`${mapping.folderId}\`\n`;
            list += `   • Added: ${new Date(mapping.addedAt).toLocaleDateString()}\n\n`;
            index++;
        });

        list += `🔄 *Default Folder:* \`${this.defaultFolderId}\`\n`;
        list += `💡 *Note:* Chats without specific mappings use the default folder.`;

        return list;
    }

    /**
     * Find mappings by folder ID
     * @param {String} folderId - Google Drive folder ID
     * @returns {Array} Array of chat IDs using this folder
     */
    getChatsByFolder(folderId) {
        const chats = [];
        this.mappings.forEach((mapping, chatId) => {
            if (mapping.folderId === folderId) {
                chats.push(chatId);
            }
        });
        return chats;
    }
}

module.exports = FolderMappingManager;