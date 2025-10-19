const chalk = require('chalk');
const moment = require('moment');
const config = require('../config');

/**
 * GroupInfo Command
 * Displays comprehensive information about the current group
 */
class GroupInfoCommand {
    constructor() {
        this.name = 'groupinfo';
        this.description = config.commands.groupinfo.description;
        this.enabled = config.commands.groupinfo.enabled;
        this.groupOnly = true; // Only works in groups
    }

    /**
     * Execute the groupinfo command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            const chat = await message.getChat();
            
            // Check if it's a group
            if (!chat.isGroup) {
                await message.reply(config.messages.groupOnly);
                return;
            }

            // Gather group information
            const groupInfo = await this.gatherGroupInfo(chat, botInstance);
            
            // Format and send the group information
            const infoMessage = this.formatGroupInfo(groupInfo);
            
            // Send message without mentions to avoid WhatsApp Web.js issues
            await message.reply(infoMessage);

            console.log(chalk.green(`📊 Group info sent for: ${chat.name}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Error in groupinfo command:', error.message));
            await message.reply('❌ Failed to fetch group information. Please try again.');
        }
    }

    /**
     * Gather comprehensive group information
     * @param {Object} chat - WhatsApp chat object
     * @param {Object} botInstance - Bot instance for owner info
     * @returns {Object} Group information object
     */
    async gatherGroupInfo(chat, botInstance) {
        const info = {
            name: chat.name || 'Unknown Group',
            id: chat.id._serialized,
            description: chat.description || 'No description available',
            createdAt: null,
            createdBy: null,
            participantCount: 0,
            adminCount: 0,
            participants: [],
            admins: [],
            hasGroupImage: false,
            isAnnouncement: false,
            isEphemeral: false,
            // Owner information
            hasOwner: false,
            ownerInfo: null
        };

        try {
            // Get participants information
            if (chat.participants && chat.participants.length > 0) {
                info.participantCount = chat.participants.length;
                
                // Count admins and get participant info
                info.participants = chat.participants.map(p => p.id.user);
                info.admins = chat.participants
                    .filter(p => p.isAdmin || p.isSuperAdmin)
                    .map(p => p.id.user);
                info.adminCount = info.admins.length;
            }

            // Get creation date if available
            if (chat.createdAt) {
                info.createdAt = moment.unix(chat.createdAt).format('YYYY-MM-DD HH:mm:ss');
            }

            // Get group settings
            info.isAnnouncement = chat.isAnnouncement || false;
            info.isEphemeral = chat.isEphemeral || false;

            // Check if group has profile picture
            try {
                const profilePicUrl = await chat.getProfilePicUrl();
                info.hasGroupImage = !!profilePicUrl;
            } catch (picError) {
                info.hasGroupImage = false;
            }

            // Get group owner information from bot's owner management system
            if (botInstance && botInstance.ownerManager) {
                try {
                    const ownerId = botInstance.ownerManager.getOwner(chat.id._serialized);
                    console.log(chalk.cyan(`🔍 Owner check for group ${chat.id._serialized}: ${ownerId || 'No owner'}`));
                    
                    if (ownerId) {
                        info.hasOwner = true;
                        
                        // Try to get owner details from participants
                        const ownerParticipant = chat.participants.find(p => p.id._serialized === ownerId);
                        if (ownerParticipant) {
                            info.ownerInfo = {
                                id: ownerId,
                                number: ownerParticipant.id.user,
                                isAdmin: ownerParticipant.isAdmin || ownerParticipant.isSuperAdmin,
                                isInGroup: true
                            };
                            console.log(chalk.green(`✅ Owner found in group: ${ownerParticipant.id.user}`));
                        } else {
                            // Owner is set but not in group (left or removed)
                            const ownerNumber = ownerId.replace('@c.us', '').replace('@lid', '');
                            info.ownerInfo = {
                                id: ownerId,
                                number: ownerNumber,
                                isAdmin: false,
                                isInGroup: false
                            };
                            console.log(chalk.yellow(`⚠️ Owner not in group: ${ownerNumber}`));
                        }
                    }
                } catch (ownerError) {
                    console.error(chalk.red('❌ Error getting owner info:', ownerError.message));
                    info.hasOwner = false;
                    info.ownerInfo = null;
                }
            }

        } catch (error) {
            console.error(chalk.yellow('⚠️ Some group info unavailable:', error.message));
        }

        return info;
    }

    /**
     * Format group information into a readable message
     * @param {Object} info - Group information object
     * @returns {String} Formatted message string
     */
    formatGroupInfo(info) {
        let message = `📊 *Group Information*\n\n`;
        
        // Basic Info
        message += `👥 *Name:* ${info.name}\n`;
        message += `🆔 *Group ID:* \`${info.id}\`\n`;
        message += `📝 *Description:* ${info.description}\n\n`;
        
        // Statistics
        message += `📈 *Statistics:*\n`;
        message += `• Total Members: ${info.participantCount}\n`;
        message += `• Admins: ${info.adminCount}\n`;
        message += `• Regular Members: ${info.participantCount - info.adminCount}\n\n`;
        
        // Creation Info
        message += `📅 *Created:* ${info.createdAt || 'Unknown date'}\n`;
        
        // Owner Information
        message += `\n👑 *Bot Owner:*\n`;
        if (info.hasOwner && info.ownerInfo) {
            message += `• Owner: +${info.ownerInfo.number}\n`;
            message += `• Status: ${info.ownerInfo.isInGroup ? '✅ In Group' : '❌ Not in Group'}\n`;
            if (info.ownerInfo.isInGroup) {
                message += `• Group Admin: ${info.ownerInfo.isAdmin ? '✅ Yes' : '❌ No'}\n`;
            }
        } else {
            message += `• No owner set for this group\n`;
            message += `• Group admins have bot access\n`;
        }
        
        // Group Settings
        message += `\n⚙️ *Settings:*\n`;
        message += `• Profile Picture: ${info.hasGroupImage ? '✅ Yes' : '❌ No'}\n`;
        message += `• Announcement Mode: ${info.isAnnouncement ? '✅ On' : '❌ Off'}\n`;
        message += `• Disappearing Messages: ${info.isEphemeral ? '✅ On' : '❌ Off'}\n\n`;
        
        // Admin List (if not too many)
        if (info.adminCount > 0 && info.adminCount <= 10) {
            message += `👑 *Admins:*\n`;
            info.admins.forEach((admin, index) => {
                message += `${index + 1}. @${admin}\n`;
            });
        } else if (info.adminCount > 10) {
            message += `👑 *Admins:* ${info.adminCount} (too many to list)\n`;
        }
        
        message += `\n🤖 *Info generated by ${config.botName}*`;
        
        return message;
    }
}

module.exports = GroupInfoCommand;