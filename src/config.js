const config = {
    // Bot Configuration
    botName: 'Konoha Bot',
    prefix: '.',
    
    // Session Configuration
    sessionPath: './sessions',
    sessionName: 'konoha-session',
    
    // Authentication Configuration
    authTimeout: 60000, // 60 seconds timeout for auth
    
    // Command Configuration
    commands: {
        ping: {
            enabled: true,
            description: 'Show bot status, ping, and uptime'
        },
        tagall: {
            enabled: true,
            description: 'Tag all group members',
            groupOnly: true
        },
        groupinfo: {
            enabled: true,
            description: 'Show detailed group information',
            groupOnly: true
        },
        joke: {
            enabled: true,
            description: 'Send a random joke to brighten the day'
        },
        meme: {
            enabled: true,
            description: 'Send a random meme for entertainment'
        },
        translate: {
            enabled: true,
            description: 'Translate text to different languages'
        },
        translat: {
            enabled: true,
            description: 'Translate replied messages to different languages'
        },
        ownerset: {
            enabled: true,
            description: 'Set group owner with full bot access (Bot Owner Only)',
            groupOnly: true
        },
        ownerreset: {
            enabled: true,
            description: 'Reset/remove group owner permissions (Bot Owner Only)',
            groupOnly: true
        },
        analyze: {
            enabled: true,
            description: 'Analyze Excel file to find players below target points'
        },
        fetchexcel: {
            enabled: true,
            description: 'Fetch latest Excel from Google Drive and send to contact (Bot Owner Only)'
        },
        setcontact: {
            enabled: true,
            description: 'Set contact for Excel file delivery (Bot Owner Only)'
        },
        showcontacts: {
            enabled: true,
            description: 'Show configured contacts for Excel delivery (Bot Owner Only)'
        },
        setfolder: {
            enabled: true,
            description: 'Set auto-fetch: folder to chat mapping (Bot Owner Only)'
        },
        showfolders: {
            enabled: true,
            description: 'Show all auto-fetch mappings (Bot Owner Only)'
        },
        stopfolder: {
            enabled: true,
            description: 'Stop auto-fetching for specific folder (Bot Owner Only)'
        },
        getchatid: {
            enabled: true,
            description: 'Get current chat ID for folder mapping setup'
        },
        authdrive: {
            enabled: true,
            description: 'Authenticate Google Drive for auto-fetch system (Bot Owner Only)'
        },
        help: {
            enabled: true,
            description: 'Show available commands and usage help'
        }
    },
    
    // Google Drive Configuration
    googleDrive: {
        enabled: true,
        credentialsFile: './config/google-credentials.json',
        tokenFile: './config/google-token.json',
        excelMimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/vnd.google-apps.spreadsheet' // Google Sheets
        ]
    },
    
    // Auto-Fetch Configuration - Automatic Excel file monitoring and delivery
    autoFetch: {
        enabled: true,
        storageFile: './data/auto-fetch-mappings.json',
        checkInterval: 300000, // Check every 5 minutes (in milliseconds)
        retryInterval: 60000,   // Retry failed checks every 1 minute
        maxRetries: 3          // Maximum retry attempts
    },
    
    // Contact Management for Excel Delivery
    contactManagement: {
        enabled: true,
        storageFile: './data/excel-contacts.json'
    },
    
    // Folder Mapping Configuration (legacy, still needed for backward compatibility)
    folderMapping: {
        enabled: true,
        storageFile: './data/folder-mappings.json',
        defaultFolderId: null
    },
    
    // Owner Management Configuration
    ownerManagement: {
        enabled: true,
        storageFile: './data/group-owners.json'
    },
    
    // Bot Owner Configuration - Only this number can manage group owners
    botOwner: {
        number: '919675893215', // Bot owner's phone number
        whatsappId: '919675893215@c.us' // WhatsApp ID format (c.us for regular numbers)
    },
    
    // Message Configuration
    messages: {
        welcome: '🤖 Konoha Bot is now online!',
        authSuccess: '✅ Authentication successful!',
        authFailed: '❌ Authentication failed!',
        sessionSaved: '💾 Session saved successfully!',
        sessionLoaded: '📂 Session loaded successfully!',
        groupOnly: '⚠️ This command can only be used in groups!',
        unknownCommand: '❓ Unknown command. Use .help to see available commands',
        pong: '🏓 *Pong!*',
        tagallPrefix: '📢 Attention everyone!'
    }
};

module.exports = config;