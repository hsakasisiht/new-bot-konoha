const fs = require('fs');
const path = require('path');

/**
 * Command Loader
 * Dynamically loads all command files from the commands directory
 */
class CommandLoader {
    /**
     * Load all commands from the commands directory
     * @returns {Map} Map of command name to command instance
     */
    static loadCommands() {
        const commands = new Map();
        const commandsPath = __dirname;
        
        // Get all .js files in the commands directory (excluding index.js)
        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js') && file !== 'index.js');

        for (const file of commandFiles) {
            try {
                const CommandClass = require(path.join(commandsPath, file));
                const command = new CommandClass();
                
                // Only load enabled commands
                if (command.enabled) {
                    commands.set(command.name, command);
                }
            } catch (error) {
                console.error(`❌ Failed to load command from ${file}:`, error.message);
            }
        }

        return commands;
    }

    /**
     * Get list of available command files
     * @returns {Array} Array of command file names
     */
    static getAvailableCommands() {
        const commandsPath = __dirname;
        return fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js') && file !== 'index.js')
            .map(file => path.basename(file, '.js'));
    }
}

module.exports = CommandLoader;