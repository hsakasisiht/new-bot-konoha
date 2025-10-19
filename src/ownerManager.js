const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

/**
 * Owner Management System
 * Handles group owners who have full bot access
 */
class OwnerManager {
    constructor() {
        this.ownerFilePath = config.ownerManagement.storageFile;
        this.owners = new Map(); // groupId -> ownerId
        this.init();
    }

    /**
     * Initialize the owner management system
     */
    async init() {
        try {
            await this.loadOwners();
            if (!config.production || config.logging.showStartup) {
                console.log(chalk.green('👑 Owner management system initialized'));
                console.log(chalk.blue(`🤖 Bot Owner: ${config.botOwner.number}`));
            }
        } catch (error) {
            if (config.logging.showErrors) {
                console.error(chalk.red('❌ Failed to initialize owner management:', error.message));
            }
        }
    }

    /**
     * Load owners from storage file
     */
    async loadOwners() {
        try {
            if (await fs.pathExists(this.ownerFilePath)) {
                const data = await fs.readJson(this.ownerFilePath);
                this.owners = new Map(Object.entries(data));
                if (!config.production || config.logging.showStartup) {
                    console.log(chalk.cyan(`📂 Loaded ${this.owners.size} group owners`));
                }
            } else {
                // Create empty owners file
                await this.saveOwners();
                if (!config.production || config.logging.showStartup) {
                    console.log(chalk.yellow('📝 Created new group owners file'));
                }
            }
        } catch (error) {
            if (config.logging.showErrors) {
                console.error(chalk.red('❌ Error loading owners:', error.message));
            }
            this.owners = new Map();
        }
    }

    /**
     * Save owners to storage file
     */
    async saveOwners() {
        try {
            const ownersObject = Object.fromEntries(this.owners);
            await fs.ensureFile(this.ownerFilePath);
            await fs.writeJson(this.ownerFilePath, ownersObject, { spaces: 2 });
            console.log(chalk.green('💾 Group owners saved successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Error saving owners:', error.message));
        }
    }

    /**
     * Set a group owner
     * @param {String} groupId - WhatsApp group ID
     * @param {String} ownerId - Owner's WhatsApp ID
     * @returns {Boolean} Success status
     */
    async setOwner(groupId, ownerId) {
        try {
            this.owners.set(groupId, ownerId);
            await this.saveOwners();
            console.log(chalk.green(`👑 Owner set for group ${groupId}: ${ownerId}`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Error setting owner:', error.message));
            return false;
        }
    }

    /**
     * Remove a group owner
     * @param {String} groupId - WhatsApp group ID
     * @returns {Boolean} Success status
     */
    async removeOwner(groupId) {
        try {
            const removed = this.owners.delete(groupId);
            if (removed) {
                await this.saveOwners();
                console.log(chalk.yellow(`👑 Owner removed for group ${groupId}`));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red('❌ Error removing owner:', error.message));
            return false;
        }
    }

    /**
     * Get the owner of a group
     * @param {String} groupId - WhatsApp group ID
     * @returns {String|null} Owner ID or null if no owner
     */
    getOwner(groupId) {
        return this.owners.get(groupId) || null;
    }

    /**
     * Check if a user is the owner of a group
     * @param {String} groupId - WhatsApp group ID
     * @param {String} userId - User's WhatsApp ID
     * @returns {Boolean} True if user is owner
     */
    isOwner(groupId, userId) {
        const owner = this.getOwner(groupId);
        return owner === userId;
    }

    /**
     * Check if a user is the bot owner
     * @param {String} userId - User's WhatsApp ID
     * @returns {Boolean} True if user is bot owner
     */
    isBotOwner(userId) {
        return userId === config.botOwner.whatsappId;
    }

    /**
     * Check if a user is a group admin
     * @param {Object} message - WhatsApp message object
     * @param {String} userId - User's WhatsApp ID (optional, will use message sender if not provided)
     * @returns {Boolean} True if user is admin
     */
    async isGroupAdmin(message, userId = null) {
        try {
            if (!message.from.includes('@g.us')) {
                return false; // Not a group
            }

            // Determine the user ID to check
            let userToCheck = userId;
            if (!userToCheck) {
                // Use message author for group messages, or message.from for private
                userToCheck = message.author || message.from;
            }

            const chat = await message.getChat();
            const participants = chat.participants;
            
            const participant = participants.find(p => p.id._serialized === userToCheck);
            const isAdmin = participant && participant.isAdmin;
            
            console.log(chalk.cyan(`🔍 Admin check: ${userToCheck} in ${message.from} = ${isAdmin}`));
            return isAdmin;
        } catch (error) {
            console.error(chalk.red('❌ Error checking admin status:', error.message));
            return false;
        }
    }

    /**
     * Check if a user has owner privileges in a group
     * @param {String} groupId - WhatsApp group ID
     * @param {String} userId - User's WhatsApp ID
     * @param {Object} message - WhatsApp message object (for admin check)
     * @returns {Boolean} True if user has owner privileges
     */
    async hasOwnerPrivileges(groupId, userId, message) {
        // Check if user is the set owner
        if (this.isOwner(groupId, userId)) {
            return true;
        }

        // If no owner is set, group admins have owner privileges
        const currentOwner = this.getOwner(groupId);
        if (!currentOwner) {
            return await this.isGroupAdmin(message, userId);
        }

        return false;
    }

    /**
     * Get all groups with owners
     * @returns {Map} Map of groupId -> ownerId
     */
    getAllOwners() {
        return new Map(this.owners);
    }

    /**
     * Get owner count
     * @returns {Number} Number of groups with owners
     */
    getOwnerCount() {
        return this.owners.size;
    }
}

module.exports = OwnerManager;