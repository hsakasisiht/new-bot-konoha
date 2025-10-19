const fs = require('fs-extra');
const chalk = require('chalk');
const config = require('./config');

/**
 * Contact Manager for Excel Delivery
 * Manages contacts who receive Excel files from Google Drive
 */
class ContactManager {
    constructor() {
        this.contactsFilePath = config.contactManagement.storageFile;
        this.contacts = new Map(); // nickname -> { chatId, name, addedAt }
        this.init();
    }

    /**
     * Initialize the contact management system
     */
    async init() {
        try {
            await this.loadContacts();
            console.log(chalk.green('📇 Contact management system initialized'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize contact management:', error.message));
        }
    }

    /**
     * Load contacts from storage file
     */
    async loadContacts() {
        try {
            if (await fs.pathExists(this.contactsFilePath)) {
                const data = await fs.readJson(this.contactsFilePath);
                this.contacts = new Map(Object.entries(data));
                console.log(chalk.cyan(`📂 Loaded ${this.contacts.size} contacts`));
            } else {
                // Create empty contacts file
                await this.saveContacts();
                console.log(chalk.yellow('📝 Created new contacts file'));
            }
        } catch (error) {
            console.error(chalk.red('❌ Error loading contacts:', error.message));
            this.contacts = new Map();
        }
    }

    /**
     * Save contacts to storage file
     */
    async saveContacts() {
        try {
            const contactsObject = Object.fromEntries(this.contacts);
            await fs.ensureFile(this.contactsFilePath);
            await fs.writeJson(this.contactsFilePath, contactsObject, { spaces: 2 });
            console.log(chalk.green('💾 Contacts saved successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Error saving contacts:', error.message));
        }
    }

    /**
     * Add a new contact
     * @param {String} nickname - Nickname for the contact
     * @param {String} chatId - WhatsApp chat ID
     * @param {String} name - Display name (optional)
     * @returns {Boolean} Success status
     */
    async addContact(nickname, chatId, name = null) {
        try {
            const contact = {
                chatId: chatId,
                name: name || nickname,
                addedAt: new Date().toISOString()
            };

            this.contacts.set(nickname.toLowerCase(), contact);
            await this.saveContacts();
            
            console.log(chalk.green(`📇 Contact added: ${nickname} (${chatId})`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Error adding contact:', error.message));
            return false;
        }
    }

    /**
     * Remove a contact
     * @param {String} nickname - Nickname of the contact to remove
     * @returns {Boolean} Success status
     */
    async removeContact(nickname) {
        try {
            const removed = this.contacts.delete(nickname.toLowerCase());
            if (removed) {
                await this.saveContacts();
                console.log(chalk.yellow(`📇 Contact removed: ${nickname}`));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red('❌ Error removing contact:', error.message));
            return false;
        }
    }

    /**
     * Get a contact by nickname
     * @param {String} nickname - Nickname of the contact
     * @returns {Object|null} Contact object or null
     */
    getContact(nickname) {
        return this.contacts.get(nickname.toLowerCase()) || null;
    }

    /**
     * Get all contacts
     * @returns {Map} Map of all contacts
     */
    getAllContacts() {
        return new Map(this.contacts);
    }

    /**
     * Check if a contact exists
     * @param {String} nickname - Nickname to check
     * @returns {Boolean} True if contact exists
     */
    hasContact(nickname) {
        return this.contacts.has(nickname.toLowerCase());
    }

    /**
     * Get contact count
     * @returns {Number} Number of contacts
     */
    getContactCount() {
        return this.contacts.size;
    }

    /**
     * Update contact information
     * @param {String} nickname - Nickname of the contact
     * @param {Object} updates - Updates to apply
     * @returns {Boolean} Success status
     */
    async updateContact(nickname, updates) {
        try {
            const contact = this.getContact(nickname);
            if (!contact) {
                return false;
            }

            // Apply updates
            Object.assign(contact, updates);
            contact.updatedAt = new Date().toISOString();

            this.contacts.set(nickname.toLowerCase(), contact);
            await this.saveContacts();

            console.log(chalk.green(`📇 Contact updated: ${nickname}`));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Error updating contact:', error.message));
            return false;
        }
    }

    /**
     * Get formatted contact list for display
     * @returns {String} Formatted contact list
     */
    getFormattedContactList() {
        if (this.contacts.size === 0) {
            return 'No contacts configured for Excel delivery.';
        }

        let list = `📇 *Excel Delivery Contacts:*\n\n`;
        let index = 1;

        this.contacts.forEach((contact, nickname) => {
            list += `${index}. *${nickname}*\n`;
            list += `   • Name: ${contact.name}\n`;
            list += `   • Chat ID: \`${contact.chatId}\`\n`;
            list += `   • Added: ${new Date(contact.addedAt).toLocaleDateString()}\n\n`;
            index++;
        });

        return list;
    }
}

module.exports = ContactManager;