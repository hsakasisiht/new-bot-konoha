# Commands Directory

This directory contains all bot commands in separate, modular files for better organization and maintainability.

## Structure

```
src/commands/
├── index.js       # Command loader - dynamically loads all commands
├── ping.js        # Ping command implementation
├── tagall.js      # Tag all command implementation
└── README.md      # This file
```

## Adding New Commands

To add a new command:

1. **Create a new file** in this directory (e.g., `newcommand.js`)
2. **Follow the command class structure**:

```javascript
const config = require('../config');

class NewCommand {
    constructor() {
        this.name = 'newcommand';           // Command name
        this.description = 'Description';    // Command description
        this.enabled = true;                // Enable/disable command
        this.groupOnly = false;             // Restrict to groups only
    }

    async execute(message, args, client, botInstance) {
        // Your command logic here
        await message.reply('Hello from new command!');
    }
}

module.exports = NewCommand;
```

3. **Add command configuration** to `src/config.js`:

```javascript
newcommand: {
    enabled: true,
    description: 'Your command description'
}
```

4. **Restart the bot** - commands are loaded automatically!

## Command Class Properties

- `name`: Command name (used with prefix, e.g., `.ping`)
- `description`: Help text for the command
- `enabled`: Whether the command is active
- `groupOnly`: If true, command only works in groups

## Command Execute Method

The `execute` method receives:
- `message`: WhatsApp message object
- `args`: Array of command arguments (words after command)
- `client`: WhatsApp client instance
- `botInstance`: Bot instance (for accessing bot status, etc.)

## Examples

### Simple Command
```javascript
async execute(message, args, client, botInstance) {
    await message.reply('Simple response!');
}
```

### Command with Arguments
```javascript
async execute(message, args, client, botInstance) {
    if (args.length === 0) {
        await message.reply('Please provide arguments!');
        return;
    }
    
    const text = args.join(' ');
    await message.reply(`You said: ${text}`);
}
```

### Group-only Command
```javascript
constructor() {
    // ...
    this.groupOnly = true;
}

async execute(message, args, client, botInstance) {
    const chat = await message.getChat();
    await message.reply(`Group name: ${chat.name}`);
}
```

## Benefits

- ✅ **Modular**: Each command is separate and independent
- ✅ **Maintainable**: Easy to modify individual commands
- ✅ **Scalable**: Add new commands without touching existing code
- ✅ **Organized**: Clear file structure and separation of concerns
- ✅ **Auto-loading**: Commands are loaded automatically on startup