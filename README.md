# 🍃 Konoha WhatsApp Bot

A powerful WhatsApp bot with real-time authentication, Google Drive integration, and automatic Excel file delivery system.

## ⭐ Features

- 🔐 **WhatsApp Authentication**: Phone number + pairing code method
- 💾 **Session Management**: Persistent login across restarts  
- 📊 **Excel Analysis**: Automatic analysis of player performance data
- 🗂️ **Google Drive Integration**: Service account based file access
- 🤖 **Auto-Fetch System**: Monitors Drive folders and auto-delivers files
- � **Permission System**: Multi-tier access control (Bot Owner > Group Owner > Users)
- � **Smart Help System**: Context-aware command help with permission filtering
- 📱 **Cross-Platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Setup

### Prerequisites
- Node.js 16+ installed
- Google Cloud Platform account
- WhatsApp account

### 1. Clone & Install
```bash
git clone https://github.com/hsakasisiht/new-bot-konoha.git
cd new-bot-konoha
npm install
```

### 2. Google Drive API Setup

#### Create Service Account:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create Service Account credentials
5. Download the JSON key file

#### Configure Credentials:
1. Copy `config/google-credentials.template.json` to `config/google-credentials.json`
2. Replace the template values with your actual service account credentials

### 3. Bot Configuration
Update bot configuration in `src/config.js` with your bot owner phone number.

### 4. Run the Bot
```bash
npm start
```

### 5. WhatsApp Authentication
- Scan the QR code with your WhatsApp
- Or use phone number + pairing code method

## 🤖 Commands

### Public Commands (All Users)
- `.ping` - Check bot status and uptime
- `.joke` - Get a random joke
- `.meme` - Get a random meme
- `.translate [lang] [text]` - Translate text between languages  
- `.translat [lang]` - Translate replied message
- `.help` - Show available commands
- `.getchatid` - Get current chat ID

### Group Commands  
- `.tagall [message]` - Tag all group members
- `.groupinfo` - Show group information
- `.analyze` - Analyze Excel files (send file with command)

### Owner Commands (Bot/Group Owners Only)
- `.ownerset [@user]` - Set group owner
- `.ownerreset` - Reset group owners
- `.fetchexcel` - Fetch Excel from mapped Drive folder
- `.setfolder [drive-url]` - Map Drive folder to current chat
- `.showfolders` - List all folder mappings
- `.stopfolder` - Remove folder mapping for current chat
- `.setcontact [name] [phone]` - Add contact mapping
- `.showcontacts` - List contact mappings
- `.authdrive` - Test Google Drive connection

### Usage Examples
```bash
# Basic commands
.ping
.joke
.help translate

# Group management
.tagall Meeting at 5 PM everyone!
.ownerset @john

# Excel analysis
# (Send Excel file with caption: .analyze)

# Drive integration  
.setfolder https://drive.google.com/drive/folders/1abc...
.fetchexcel
```

## 🔐 Security Notes

**NEVER commit these files to Git:**
- `google-credentials.json`
- `client_secret_*.json` 
- `sublime-index-*.json`
- `.env` files

The `.gitignore` file prevents accidental commits of sensitive data.

## 📊 Auto-Fetch System

The bot can automatically monitor Google Drive folders and send new Excel files to mapped WhatsApp chats:

1. **Setup Folder Mapping**: Use `.setfolder [drive-url]` in target chat
2. **Automatic Monitoring**: Bot checks every 5 minutes for new files  
3. **Smart Delivery**: Only sends Excel files (.xlsx, .xls) to mapped chats
4. **Multiple Mappings**: Different folders for different chats

## 🛠️ Advanced Configuration

### Custom Commands
Add new commands in `src/commands/` directory following the existing pattern.

### Database Files
- `data/owners.json` - Group owner permissions
- `data/contacts.json` - Contact name mappings  
- `data/auto-fetch-mappings.json` - Drive folder mappings

### Permission System
- **Bot Owner**: Full access to all commands (set in config.js)
- **Group Owners**: Can use owner commands in their groups
- **Regular Users**: Access to public commands only

## 📞 Support & Troubleshooting

1. **Bot won't start**: Check Node.js version (16+)
2. **Drive integration issues**: Verify service account setup
3. **Authentication problems**: Clear sessions folder and restart
4. **Command not working**: Use `.help [command]` for usage info

## 🔄 Updates

```bash
git pull origin main
npm install
npm start
```

---
**🍃 Made with ❤️ for WhatsApp automation**