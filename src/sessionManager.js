const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

class SessionManager {
    constructor() {
        this.sessionPath = path.resolve(config.sessionPath);
        this.sessionFile = path.join(this.sessionPath, `${config.sessionName}.json`);
        this.ensureSessionDirectory();
    }

    /**
     * Ensure session directory exists
     */
    async ensureSessionDirectory() {
        try {
            await fs.ensureDir(this.sessionPath);
            console.log(chalk.blue('📁 Session directory ready'));
        } catch (error) {
            console.error(chalk.red('❌ Failed to create session directory:', error.message));
        }
    }

    /**
     * Check if session exists
     */
    async hasSession() {
        try {
            return await fs.pathExists(this.sessionFile);
        } catch (error) {
            console.error(chalk.red('❌ Error checking session:', error.message));
            return false;
        }
    }

    /**
     * Load existing session
     */
    async loadSession() {
        try {
            if (await this.hasSession()) {
                const sessionData = await fs.readJson(this.sessionFile);
                console.log(chalk.green('📂 Session loaded from file'));
                return sessionData;
            }
            return null;
        } catch (error) {
            console.error(chalk.red('❌ Failed to load session:', error.message));
            return null;
        }
    }

    /**
     * Save session data
     */
    async saveSession(sessionData) {
        try {
            await fs.writeJson(this.sessionFile, sessionData, { spaces: 2 });
            console.log(chalk.green('💾 Session saved successfully'));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Failed to save session:', error.message));
            return false;
        }
    }

    /**
     * Delete session
     */
    async deleteSession() {
        try {
            if (await this.hasSession()) {
                await fs.remove(this.sessionFile);
                console.log(chalk.yellow('🗑️ Session deleted'));
                return true;
            }
            return false;
        } catch (error) {
            console.error(chalk.red('❌ Failed to delete session:', error.message));
            return false;
        }
    }

    /**
     * Get session file path
     */
    getSessionPath() {
        return this.sessionFile;
    }
}

module.exports = SessionManager;