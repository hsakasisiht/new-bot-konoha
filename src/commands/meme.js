const chalk = require('chalk');
const { MessageMedia } = require('whatsapp-web.js');
const config = require('../config');

/**
 * Meme Command
 * Sends random memes to entertain users
 */
class MemeCommand {
    constructor() {
        this.name = 'meme';
        this.description = config.commands.meme.description;
        this.enabled = config.commands.meme.enabled;
        this.groupOnly = false; // Works in both groups and private chats
        
        // Collection of viral image memes - always random selection
        this.memes = [
            // Viral Meme Images from reliable sources
            "https://i.imgflip.com/1bij.jpg", // Success Kid
            "https://i.imgflip.com/16iyn1.jpg", // Drake pointing
            "https://i.imgflip.com/5c7lwq.png", // Bernie Sanders sitting
            "https://i.imgflip.com/1otk96.jpg", // Distracted Boyfriend
            "https://i.imgflip.com/23ls.jpg", // Philosoraptor
            "https://i.imgflip.com/9ehk.jpg", // Weird Stuff I Do Potoo
            "https://i.imgflip.com/1g8my4.jpg", // Drake Blank
            "https://i.imgflip.com/30b1gx.jpg", // Drake Yes/No
            "https://i.imgflip.com/26am.jpg", // Unpopular Opinion Puffin
            "https://i.imgflip.com/235w.jpg", // Bad Luck Brian
            "https://i.imgflip.com/61kuy.jpg", // Surprised Pikachu
            "https://i.imgflip.com/1ur9b0.jpg", // Roll Safe
            "https://i.imgflip.com/1c1uej.jpg", // Leonardo Dicaprio Cheers
            "https://i.imgflip.com/4t0m5.jpg", // Woman Yelling at Cat
            "https://i.imgflip.com/1ihzfe.jpg", // Expanding Brain
            "https://i.imgflip.com/1wz1t.jpg", // Monkey Puppet
            "https://i.imgflip.com/261o3j.jpg", // Galaxy Brain
            "https://i.imgflip.com/34salh.jpg", // Stonks
            "https://i.imgflip.com/4/1e7oxd.jpg", // This is Fine Dog
            
            // More viral memes
            "https://i.imgflip.com/6eewtf.jpg", // Gigachad
            "https://i.imgflip.com/39u1lm.png", // Coffin Dance
            "https://i.imgflip.com/4acd7j.png", // Always Has Been
            "https://i.imgflip.com/2zo1ki.jpg", // Outstanding Move
            
            "https://i.imgflip.com/3oevdk.jpg", // Panik Kalm Panik
            "https://i.imgflip.com/2cp1.jpg", // Sparta Leonidas
            "https://i.imgflip.com/1o00in.jpg", // Pablo Escobar Waiting
            "https://i.imgflip.com/4q29.jpg", // Y U No Guy
            
            "https://i.imgflip.com/1tl71a.jpg", // Ight Imma Head Out
            "https://i.imgflip.com/4x6ow.jpg", // Doge
            "https://i.imgflip.com/2fm6x.jpg", // Disaster Girl
            "https://i.imgflip.com/17wip.jpg", // See Nobody Cares
            
            "https://i.imgflip.com/25w3.jpg", // Futurama Fry
            "https://i.imgflip.com/1hkqcm.jpg", // Mocking SpongeBob
            "https://i.imgflip.com/jcqg.jpg", // Hide the Pain Harold
            "https://i.imgflip.com/1g7h4m.jpg", // Logan Paul
            
            "https://i.imgflip.com/5jeamx.png", // Amogus
            "https://i.imgflip.com/30h7d5.jpg", // Tom and Jerry
            "https://i.imgflip.com/3lmzyx.jpg", // Baby Yoda
            "https://i.imgflip.com/1e9mko.jpg", // Arthur Fist
            
            "https://i.imgflip.com/1yxkcp.jpg", // American Chopper Argument
            "https://i.imgflip.com/4pn1an.png", // Wojak Feels Guy
            "https://i.imgflip.com/5f96wt.png", // Chad Face
            "https://i.imgflip.com/2y3982.jpg", // Pikachu Surprised Face
            "https://i.imgflip.com/1bgs5.jpg", // Scumbag Steve
            "https://i.imgflip.com/16iof5.jpg", // Batman Slapping Robin
            "https://i.imgflip.com/2q2qvw.jpg", // Change My Mind
            "https://i.imgflip.com/3si4.jpg", // Grumpy Cat
            "https://i.imgflip.com/1ur93v.jpg", // Confused Nick Young
            "https://i.imgflip.com/1h7in3.jpg" // Salt Bae
        ];
        
        // Meme categories for variety (based on viral meme types)
        this.categories = {
            classic: [0, 1, 4, 9, 10, 24, 33], // Success Kid, Drake, Philosoraptor, Bad Luck Brian, etc.
            viral: [2, 3, 19, 20, 21, 22, 28, 29], // Bernie, Distracted Boyfriend, Gigachad, etc.
            reaction: [5, 11, 12, 25, 26, 30, 34], // Potoo, Roll Safe, Leo Cheers, etc.
            modern: [6, 7, 13, 14, 23, 27, 31, 35], // Drake templates, Woman Yelling, Stonks, etc.
            random: [8, 15, 16, 17, 18, 32, 36, 37] // All other memes for random selection
        };
    }

    /**
     * Execute the meme command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments (optional category)
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            let meme;
            
            // Check if user specified a category
            if (args.length > 0) {
                const category = args[0].toLowerCase();
                meme = this.getMemeByCategory(category);
            } else {
                meme = this.getRandomMeme();
            }
            
            // All memes are now image URLs
            await this.sendImageMeme(message, meme);
            
            console.log(chalk.green(`😂 Meme sent to ${message.from}`));
            
        } catch (error) {
            console.error(chalk.red('❌ Error in meme command:', error.message));
            await message.reply('😅 Oops! My meme collection is taking a coffee break. Try again in a moment! ☕');
        }
    }

    /**
     * Send text-based meme
     * @param {Object} message - WhatsApp message object
     * @param {String} meme - Meme text content
     */
    async sendTextMeme(message, meme) {
        await message.reply(`🎭 *MEME TIME!* 🎭\n\n${meme}\n\n😂 *Hope this made you laugh!* 🤣`);
    }

    /**
     * Send image-based meme (fallback to text if image fails)
     * @param {Object} message - WhatsApp message object
     * @param {String} memeUrl - Meme image URL
     */
     async sendImageMeme(message, memeUrl) {
        try {
            // Try to send as image with timeout
            console.log(chalk.cyan(`🖼️ Fetching meme from: ${memeUrl}`));
            
            const media = await MessageMedia.fromUrl(memeUrl, {
                unsafeMime: true,
                timeout: 10000 // 10 second timeout
            });
            
            await message.reply(media, undefined, { 
                caption: '🎭 *Viral Meme!* 😂\n\n*Fresh from the internet!* 🔥' 
            });
            
        } catch (imageError) {
            // Fallback to simple text response if image fails
            console.log(chalk.yellow('⚠️ Image meme failed, sending emoji meme instead'));
            await message.reply('😂 *Meme Time!* 🎭\n\n🤡 *Sorry, the meme is too dank for this chat!*\n\n*Try again for another random meme!* 🔄');
        }
    }

    /**
     * Get a truly random meme from the collection
     * @returns {String} Random meme
     */
    getRandomMeme() {
        return this.getRandomFromArray(this.memes);
    }

    /**
     * Get a random image meme URL
     * @returns {String} Random image meme URL
     */
    getRandomImageMeme() {
        // All memes are now image URLs
        return this.getRandomFromArray(this.memes);
    }

    /**
     * Get meme by category
     * @param {String} category - Meme category
     * @returns {String} Categorized meme
     */
    getMemeByCategory(category) {
        if (this.categories[category]) {
            const categoryIndices = this.categories[category];
            const randomIndex = this.getRandomFromArray(categoryIndices);
            return this.memes[randomIndex];
        }
        // If category doesn't exist, return random meme
        return this.getRandomMeme();
    }

    /**
     * Get random element from array with crypto randomness
     * @param {Array} array - Array to select from
     * @returns {Any} Random array element
     */
    getRandomFromArray(array) {
        let randomIndex;
        
        try {
            const crypto = require('crypto');
            const randomBytes = crypto.randomBytes(4);
            randomIndex = randomBytes.readUInt32BE(0) % array.length;
        } catch (error) {
            // Fallback to Math.random with additional randomization
            const now = Date.now();
            const seed = (now * Math.random()) % array.length;
            randomIndex = Math.floor(seed);
        }
        
        return array[randomIndex];
    }

    /**
     * Get available categories
     * @returns {Array} List of available categories
     */
    getCategories() {
        return Object.keys(this.categories);
    }

    /**
     * Get total meme count
     * @returns {Number} Total memes available
     */
    getTotalMemes() {
        return this.memes.length;
    }
}

module.exports = MemeCommand;