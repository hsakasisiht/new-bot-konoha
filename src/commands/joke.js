const chalk = require('chalk');
const config = require('../config');

/**
 * Joke Command
 * Sends random jokes to entertain users
 */
class JokeCommand {
    constructor() {
        this.name = 'joke';
        this.description = config.commands.joke.description;
        this.enabled = config.commands.joke.enabled;
        this.groupOnly = false; // Works in both groups and private chats
        
        // Collection of jokes - always random selection
        this.jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 🔬",
            "I told my wife she was drawing her eyebrows too high. She looked surprised! 😮",
            "Why don't programmers like nature? It has too many bugs! 🐛💻",
            "What do you call a fake noodle? An impasta! 🍝",
            "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
            "I'm reading a book about anti-gravity. It's impossible to put down! 📚",
            "Why don't eggs tell jokes? They'd crack each other up! 🥚😂",
            "What do you call a dinosaur that crashes his car? Tyrannosaurus Wrecks! 🦕🚗",
            "I used to hate facial hair, but then it grew on me! 🧔",
            "Why don't skeletons fight each other? They don't have the guts! 💀",
            "What's orange and sounds like a parrot? A carrot! 🥕🦜",
            "I'm terrified of elevators, so I'm going to start taking steps to avoid them! 🏃‍♂️",
            "Why did the math book look so sad? Because it had too many problems! 📖➕",
            "What do you call a sleeping bull? A bulldozer! 🐂😴",
            "Why don't scientists trust stairs? Because they're always up to something! 🪜",
            "I told a joke about construction, but I'm still working on it! 🚧",
            "What do you call a bear with no teeth? A gummy bear! 🐻🍬",
            "Why did the coffee file a police report? It got mugged! ☕🚔",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus! 🇨🇭➕",
            "Why don't pirates shower before they walk the plank? Because they'll just wash up on shore later! 🏴‍☠️🚿",
            "What do you call a fish wearing a crown? A king fish! 👑🐟",
            "Why did the bicycle fall over? Because it was two-tired! 🚲😴",
            "What do you call a factory that makes okay products? A satisfactory! 🏭👌",
            "Why don't aliens ever land at airports? Because they're looking for space! 👽🛸",
            "What do you call a group of disorganized cats? A cat-astrophe! 🐱💥",
            "Why did the tomato turn red? Because it saw the salad dressing! 🍅👗",
            "What do you call a pig that does karate? A pork chop! 🐷🥋",
            "Why don't melons get married? Because they cantaloupe! 🍈💒",
            "What do you call a fake stone? A shamrock! 🍀💎",
            "Why did the cookie go to the doctor? Because it felt crumbly! 🍪🏥",
            "What do you call a dinosaur that loves to sleep? A dino-snore! 🦴💤",
            "Why don't pencils have erasers in some countries? Because they don't make mistakes! ✏️🌍",
            "What do you call a dog magician? A labracadabrador! 🐕‍🦺🎩",
            "Why did the banana go to the doctor? It wasn't peeling well! 🍌😷",
            "What do you call a cow with no legs? Ground beef! 🐄🥩",
            "Why don't scientists trust atoms in relationships? They're always bonding with others! ⚛️💕",
            "What do you call a sleeping dinosaur? A dino-snore! 🦕💤",
            "Why did the smartphone need glasses? It lost all its contacts! 📱👓",
            "What do you call a lazy kangaroo? A pouch potato! 🦘🥔",
            "Why don't mountains ever get cold? They wear snow caps! 🏔️❄️"
        ];
    }

    /**
     * Execute the joke command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Get a random joke
            const randomJoke = this.getRandomJoke();
            
            // Send the joke
            await message.reply(`😂 *Random Joke Time!*\n\n${randomJoke}\n\n🤖 *Hope that made you smile!* 😄`);
            
            console.log(chalk.green(`😂 Joke sent to ${message.from}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Error in joke command:', error.message));
            await message.reply('❌ Sorry, my joke database seems to be having a bad day! Try again later. 😅');
        }
    }

    /**
     * Get a truly random joke from the collection
     * @returns {String} Random joke
     */
    getRandomJoke() {
        // Use crypto.randomBytes for true randomness if available, otherwise Math.random
        let randomIndex;
        
        try {
            const crypto = require('crypto');
            const randomBytes = crypto.randomBytes(4);
            randomIndex = randomBytes.readUInt32BE(0) % this.jokes.length;
        } catch (error) {
            // Fallback to Math.random with additional randomization
            const now = Date.now();
            const seed = (now * Math.random()) % this.jokes.length;
            randomIndex = Math.floor(seed);
        }
        
        return this.jokes[randomIndex];
    }

    /**
     * Get the total number of available jokes
     * @returns {Number} Total joke count
     */
    getTotalJokes() {
        return this.jokes.length;
    }

    /**
     * Add new jokes to the collection (for future expansion)
     * @param {Array} newJokes - Array of new jokes to add
     */
    addJokes(newJokes) {
        if (Array.isArray(newJokes)) {
            this.jokes.push(...newJokes);
            console.log(chalk.blue(`😂 Added ${newJokes.length} new jokes! Total: ${this.jokes.length}`));
        }
    }
}

module.exports = JokeCommand;
