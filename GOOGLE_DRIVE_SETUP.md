# Google Drive Integration Setup Guide

## Overview
This bot can fetch the latest Excel files from Google Drive and send them to configured contacts automatically.

## Features
- Fetch latest Excel files from a specific Google Drive folder
- Send files to configured WhatsApp contacts
- Support for both personal and group chats
- Bot owner-only access for security

## Setup Steps

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

### 2. Create Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure OAuth consent screen if prompted
4. Application type: "Desktop application"
5. Name: "Konoha Bot Drive Access"
6. Download the JSON file

### 3. Install Credentials
1. Rename downloaded file to `google-credentials.json`
2. Place it in the `config/` directory
3. Replace the template file

### 4. Bot Configuration
1. Get your Google Drive folder ID:
   - Open Google Drive in browser
   - Navigate to the folder containing Excel files
   - Copy the folder ID from the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

2. Update the folder ID in config.js:
   ```javascript
   googleDrive: {
     folderId: 'YOUR_FOLDER_ID_HERE'
   }
   ```

### 5. First-Time Authentication
1. Start the bot
2. The bot will show an authentication URL in console
3. Open the URL in browser
4. Allow access to your Google Drive
5. Copy the authorization code
6. The bot will save the token for future use

### 6. Configure Contacts
Use these commands to set up Excel delivery contacts:

```bash
# Add a contact
.setcontact add admin 1234567890@c.us Admin Team

# Add current chat as contact
.setcontact current reports Reports Team

# View all contacts
.showcontacts

# Remove a contact
.setcontact remove admin
```

### 7. Usage Commands

```bash
# Fetch and send to all contacts
.fetchexcel

# Fetch and send to specific contact
.fetchexcel admin

# View configured contacts
.showcontacts

# Manage contacts (bot owner only)
.setcontact [action] [parameters]
```

## File Formats Supported
- Excel files (.xlsx, .xls)
- Google Sheets (exported as Excel)

## Security Features
- Only bot owner can manage contacts
- Only bot owner can fetch files
- Secure OAuth 2.0 authentication
- Local token storage

## Troubleshooting

### Common Issues
1. **"Google Drive not configured"**
   - Ensure credentials file exists
   - Check folder ID is set
   - Verify authentication completed

2. **"No Excel files found"**
   - Check folder ID is correct
   - Ensure folder contains Excel files
   - Verify folder permissions

3. **"Failed to send to contact"**
   - Check chat ID format
   - Verify contact exists in WhatsApp
   - Check bot has permission to send files

### Support
For setup assistance, contact the bot administrator.