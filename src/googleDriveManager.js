const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const config = require('./config');

/**
 * Google Drive Manager
 * Handles Google Drive API integration for fetching Excel files
 */
class GoogleDriveManager {
    constructor() {
        this.auth = null;
        this.drive = null;
        this.initialized = false;
        this.credentialsPath = config.googleDrive.credentialsFile;
        this.tokenPath = config.googleDrive.tokenFile;
        this.excelMimeTypes = config.googleDrive.excelMimeTypes;
    }

    /**
     * Initialize Google Drive API
     */
    async initialize() {
        try {
            // Check if credentials file exists
            if (!await fs.pathExists(this.credentialsPath)) {
                console.log(chalk.yellow('⚠️ Google Drive credentials not found. Please add credentials.json'));
                return false;
            }

            // Load credentials
            const credentials = await fs.readJson(this.credentialsPath);

            // Check if it's a service account or OAuth credentials
            if (credentials.type === 'service_account') {
                // Service Account authentication
                this.auth = new google.auth.GoogleAuth({
                    keyFile: this.credentialsPath,
                    scopes: ['https://www.googleapis.com/auth/drive.readonly']
                });
                console.log(chalk.green('✅ Using Service Account authentication'));
            } else {
                // OAuth2 authentication
                const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

                // Create OAuth2 client
                this.auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

                // Check if token exists
                if (await fs.pathExists(this.tokenPath)) {
                    const token = await fs.readJson(this.tokenPath);
                    this.auth.setCredentials(token);
                    console.log(chalk.green('✅ Using OAuth2 authentication with saved token'));
                } else {
                    console.log(chalk.yellow('⚠️ Google Drive token not found. Please authenticate first.'));
                    return false;
                }
            }

            // Initialize Drive API
            this.drive = google.drive({ version: 'v3', auth: this.auth });
            this.initialized = true;

            console.log(chalk.green('✅ Google Drive API initialized'));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize Google Drive:', error.message));
            return false;
        }
    }

    /**
     * Get authorization URL for first-time setup
     */
    getAuthUrl() {
        if (!this.auth) {
            console.error(chalk.red('❌ OAuth client not initialized'));
            return null;
        }

        const authUrl = this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/drive.readonly']
        });

        return authUrl;
    }

    /**
     * Set authorization code and save token
     * @param {String} code - Authorization code from Google
     */
    async setAuthCode(code) {
        try {
            // Check if auth object supports getToken (it won't if it's a Service Account)
            if (!this.auth || typeof this.auth.getToken !== 'function') {
                console.error(chalk.red('❌ Authentication method does not support authorization codes (likely using Service Account)'));
                return false;
            }

            const { tokens } = await this.auth.getToken(code);
            this.auth.setCredentials(tokens);

            // Save token for future use
            await fs.ensureFile(this.tokenPath);
            await fs.writeJson(this.tokenPath, tokens, { spaces: 2 });

            console.log(chalk.green('✅ Google Drive token saved'));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ Failed to authenticate:', error.message));
            return false;
        }
    }

    /**
     * List Excel files in the specified folder
     * @param {String} folderId - Google Drive folder ID
     * @param {Number} limit - Maximum number of files to return
     * @returns {Array} Array of file objects
     */
    async listExcelFiles(folderId, limit = 10) {
        if (!this.initialized) {
            throw new Error('Google Drive not initialized');
        }

        if (!folderId) {
            throw new Error('Folder ID is required');
        }

        try {
            const query = `'${folderId}' in parents and (${this.excelMimeTypes.map(type => `mimeType='${type}'`).join(' or ')})`;

            const response = await this.drive.files.list({
                q: query,
                orderBy: 'modifiedTime desc',
                pageSize: limit,
                fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink)'
            });

            const files = response.data.files || [];
            console.log(chalk.cyan(`📁 Found ${files.length} Excel files in folder ${folderId}`));
            
            return files;

        } catch (error) {
            console.error(chalk.red('❌ Error listing files:', error.message));
            throw error;
        }
    }

    /**
     * Get the latest Excel file from a specific folder
     * @param {String} folderId - Google Drive folder ID
     * @returns {Object|null} Latest file object or null
     */
    async getLatestExcelFile(folderId) {
        try {
            if (!folderId) {
                throw new Error('Folder ID is required');
            }
            const files = await this.listExcelFiles(folderId, 1);
            return files.length > 0 ? files[0] : null;
        } catch (error) {
            console.error(chalk.red('❌ Error getting latest file:', error.message));
            return null;
        }
    }

    /**
     * Download a file from Google Drive
     * @param {String} fileId - Google Drive file ID
     * @param {String} outputPath - Local path to save the file
     * @returns {Boolean} Success status
     */
    async downloadFile(fileId, outputPath) {
        if (!this.initialized) {
            throw new Error('Google Drive not initialized');
        }

        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'stream' });

            await fs.ensureDir(path.dirname(outputPath));
            const dest = fs.createWriteStream(outputPath);

            return new Promise((resolve, reject) => {
                response.data
                    .on('end', () => {
                        console.log(chalk.green(`✅ File downloaded: ${outputPath}`));
                        resolve(true);
                    })
                    .on('error', err => {
                        console.error(chalk.red('❌ Download error:', err.message));
                        reject(err);
                    })
                    .pipe(dest);
            });

        } catch (error) {
            console.error(chalk.red('❌ Error downloading file:', error.message));
            throw error;
        }
    }

    /**
     * Check if Google Drive is properly configured
     * @returns {Boolean} Configuration status
     */
    isConfigured() {
        return this.initialized;
    }

    /**
     * Get configuration status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasCredentials: fs.existsSync(this.credentialsPath),
            hasToken: fs.existsSync(this.tokenPath),
            configured: this.isConfigured()
        };
    }

    /**
     * Validate if a folder ID exists and is accessible
     * @param {String} folderId - Google Drive folder ID to validate
     * @returns {Boolean} True if folder is accessible
     */
    async validateFolder(folderId) {
        if (!this.initialized) {
            throw new Error('Google Drive not initialized');
        }

        try {
            await this.drive.files.get({
                fileId: folderId,
                fields: 'id, name, mimeType'
            });
            return true;
        } catch (error) {
            console.error(chalk.red(`❌ Folder validation failed for ${folderId}:`, error.message));
            return false;
        }
    }
}

module.exports = GoogleDriveManager;