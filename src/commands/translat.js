const chalk = require('chalk');
const config = require('../config');

/**
 * Translat Command (Reply Translation)
 * Translates replied messages to different languages
 */
class TranslatCommand {
    constructor() {
        this.name = 'translat';
        this.description = config.commands.translat.description;
        this.enabled = config.commands.translat.enabled;
        this.groupOnly = false; // Works in both groups and private chats
        
        // Supported language codes (same as translate command)
        this.languageCodes = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese (Simplified)',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'tr': 'Turkish',
            'pl': 'Polish',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'cs': 'Czech',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'bg': 'Bulgarian',
            'hr': 'Croatian',
            'sk': 'Slovak',
            'sl': 'Slovenian',
            'et': 'Estonian',
            'lv': 'Latvian',
            'lt': 'Lithuanian',
            'mt': 'Maltese',
            'cy': 'Welsh',
            'ga': 'Irish',
            'is': 'Icelandic',
            'mk': 'Macedonian',
            'sq': 'Albanian',
            'sr': 'Serbian',
            'bs': 'Bosnian',
            'he': 'Hebrew',
            'fa': 'Persian',
            'ur': 'Urdu',
            'bn': 'Bengali',
            'ta': 'Tamil',
            'te': 'Telugu',
            'ml': 'Malayalam',
            'kn': 'Kannada',
            'gu': 'Gujarati',
            'mr': 'Marathi',
            'pa': 'Punjabi',
            'ne': 'Nepali',
            'si': 'Sinhala',
            'my': 'Myanmar',
            'km': 'Khmer',
            'lo': 'Lao',
            'ka': 'Georgian',
            'am': 'Amharic',
            'sw': 'Swahili',
            'zu': 'Zulu',
            'af': 'Afrikaans',
            'eu': 'Basque',
            'be': 'Belarusian',
            'ca': 'Catalan',
            'eo': 'Esperanto',
            'gl': 'Galician',
            'la': 'Latin',
            'mi': 'Maori',
            'ms': 'Malay',
            'tl': 'Filipino',
            'haw': 'Hawaiian',
            'mg': 'Malagasy',
            'sm': 'Samoan',
            'gd': 'Scottish Gaelic',
            'yi': 'Yiddish',
            'ig': 'Igbo',
            'yo': 'Yoruba',
            'ha': 'Hausa',
            'st': 'Sesotho',
            'sn': 'Shona',
            'so': 'Somali',
            'ny': 'Chichewa',
            'xh': 'Xhosa',
            'co': 'Corsican',
            'fy': 'Frisian',
            'lb': 'Luxembourgish',
            'jw': 'Javanese',
            'su': 'Sundanese',
            'ceb': 'Cebuano',
            'hmn': 'Hmong',
            'ku': 'Kurdish',
            'ky': 'Kyrgyz',
            'mn': 'Mongolian',
            'ps': 'Pashto',
            'sd': 'Sindhi',
            'ug': 'Uyghur',
            'uz': 'Uzbek',
            'tg': 'Tajik',
            'tk': 'Turkmen',
            'kk': 'Kazakh',
            'az': 'Azerbaijani',
            'hy': 'Armenian'
        };
    }

    /**
     * Execute the translat command (reply-based translation)
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments [languageCode]
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if message is a reply
            if (!message.hasQuotedMsg) {
                await this.sendReplyHelp(message);
                return;
            }

            // Check if language code provided
            if (args.length === 0) {
                await this.sendLanguageHelp(message);
                return;
            }

            const targetLang = args[0].toLowerCase();

            // Validate language code
            if (!this.languageCodes[targetLang]) {
                await this.sendLanguageError(message, targetLang);
                return;
            }

            // Get the quoted/replied message
            const quotedMsg = await message.getQuotedMessage();
            
            if (!quotedMsg || !quotedMsg.body) {
                await message.reply('❌ The replied message has no text to translate.');
                return;
            }

            const textToTranslate = quotedMsg.body;

            // Validate text length
            if (textToTranslate.length > 1000) {
                await message.reply('❌ Replied message too long! Please reply to messages under 1000 characters.');
                return;
            }

            // Perform translation
            const translation = await this.translateText(textToTranslate, targetLang);
            
            if (translation) {
                await this.sendReplyTranslation(message, quotedMsg, translation, targetLang);
                console.log(chalk.green(`🌐 Reply translation sent: ${targetLang.toUpperCase()}`));
            } else {
                await message.reply('❌ Translation failed. Please try again later.');
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Error in translat command:', error.message));
            await message.reply('❌ Translation service is temporarily unavailable. Please try again later.');
        }
    }

    /**
     * Translate text using multiple translation services (reusing translate command logic)
     * @param {String} text - Text to translate
     * @param {String} targetLang - Target language code
     * @returns {String|null} Translated text or null if failed
     */
    async translateText(text, targetLang) {
        try {
            // Try primary translation method
            let translation = await this.primaryTranslate(text, targetLang);
            
            if (translation && !translation.includes('⚠️')) {
                return translation;
            }
            
            // Fallback to secondary method
            translation = await this.fallbackTranslate(text, targetLang);
            
            if (translation && !translation.includes('⚠️')) {
                return translation;
            }
            
            // Final fallback to simple translations
            return await this.simpleTranslate(text, targetLang);
            
        } catch (error) {
            console.error(chalk.yellow('⚠️ Translation error:', error.message));
            return await this.simpleTranslate(text, targetLang);
        }
    }

    /**
     * Primary translation method using LibreTranslate API
     * @param {String} text - Text to translate
     * @param {String} targetLang - Target language code
     * @returns {String|null} Translated text or null if failed
     */
    async primaryTranslate(text, targetLang) {
        try {
            const fetch = require('node-fetch');
            
            const url = 'https://libretranslate.com/translate';
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; KonohaBot/1.0)'
                },
                body: JSON.stringify({
                    q: text,
                    source: 'auto',
                    target: targetLang,
                    format: 'text'
                }),
                timeout: 8000
            });

            if (response.ok) {
                const data = await response.json();
                if (data.translatedText) {
                    console.log(chalk.green(`✅ LibreTranslate: auto → ${targetLang}`));
                    return data.translatedText;
                }
            }
            
            return null;
            
        } catch (error) {
            console.log(chalk.yellow('⚠️ LibreTranslate unavailable, trying fallback...'));
            return null;
        }
    }

    /**
     * Fallback translation method using MyMemory API
     * @param {String} text - Text to translate
     * @param {String} targetLang - Target language code
     * @returns {String|null} Translated text or null if failed
     */
    async fallbackTranslate(text, targetLang) {
        try {
            const fetch = require('node-fetch');
            const encodedText = encodeURIComponent(text);
            
            const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;
            
            console.log(chalk.cyan(`🌐 Translating via MyMemory API: en → ${targetLang}`));
            
            const response = await fetch(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; KonohaBot/1.0)'
                }
            });
            
            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
                const translatedText = data.responseData.translatedText;
                
                if (translatedText.includes('INVALID SOURCE LANGUAGE') || 
                    translatedText.includes('MYMEMORY WARNING') ||
                    translatedText.toLowerCase() === text.toLowerCase()) {
                    
                    return await this.simpleTranslate(text, targetLang);
                }
                
                return translatedText;
            }
            
            return await this.simpleTranslate(text, targetLang);
            
        } catch (error) {
            console.error(chalk.red('❌ Fallback translation failed:', error.message));
            return await this.simpleTranslate(text, targetLang);
        }
    }

    /**
     * Simple translation fallback for common phrases
     * @param {String} text - Text to translate
     * @param {String} targetLang - Target language code
     * @returns {String} Simple translation or acknowledgment
     */
    async simpleTranslate(text, targetLang) {
        const lowerText = text.toLowerCase().trim();
        const languageName = this.languageCodes[targetLang];
        
        const commonTranslations = {
            'hello': {
                'es': 'Hola', 'fr': 'Bonjour', 'de': 'Hallo', 'hi': 'नमस्ते',
                'ja': 'こんにちは', 'ko': '안녕하세요', 'zh': '你好', 'ar': 'مرحبا',
                'ru': 'Привет', 'pt': 'Olá', 'it': 'Ciao'
            },
            'thank you': {
                'es': 'Gracias', 'fr': 'Merci', 'de': 'Danke', 'hi': 'धन्यवाद',
                'ja': 'ありがとう', 'ko': '감사합니다', 'zh': '谢谢', 'ar': 'شكرا',
                'ru': 'Спасибо', 'pt': 'Obrigado', 'it': 'Grazie'
            },
            'good morning': {
                'es': 'Buenos días', 'fr': 'Bonjour', 'de': 'Guten Morgen', 'hi': 'सुप्रभात',
                'ja': 'おはようございます', 'ko': '좋은 아침', 'zh': '早上好', 'ar': 'صباح الخير',
                'ru': 'Доброе утро', 'pt': 'Bom dia', 'it': 'Buongiorno'
            }
        };
        
        if (commonTranslations[lowerText] && commonTranslations[lowerText][targetLang]) {
            return commonTranslations[lowerText][targetLang];
        }
        
        return `⚠️ Translation to ${languageName} temporarily unavailable. The text "${text}" could not be translated at this time.`;
    }

    /**
     * Send the reply translation result
     * @param {Object} message - WhatsApp message object
     * @param {Object} quotedMsg - Original quoted message
     * @param {String} translatedText - Translated text
     * @param {String} targetLang - Target language code
     */
    async sendReplyTranslation(message, quotedMsg, translatedText, targetLang) {
        const languageName = this.languageCodes[targetLang];
        
        // Check if translation contains an error message
        if (translatedText.includes('⚠️') || translatedText.includes('temporarily unavailable')) {
            await message.reply(translatedText);
            return;
        }
        
        let response = `🔁 *Reply Translation*\n\n`;
        response += `📝 *Original Message:* ${quotedMsg.body}\n\n`;
        response += `🎯 *${languageName} (${targetLang.toUpperCase()}):* ${translatedText}\n\n`;
        response += `🤖 *Translated by ${config.botName}*`;
        
        await message.reply(response);
    }

    /**
     * Send help for reply usage
     * @param {Object} message - WhatsApp message object
     */
    async sendReplyHelp(message) {
        let helpMsg = `🔁 *Reply Translation Help*\n\n`;
        helpMsg += `❗ *This command works by replying to messages*\n\n`;
        helpMsg += `📋 *How to use:*\n`;
        helpMsg += `1️⃣ Reply to any message\n`;
        helpMsg += `2️⃣ Type: \`.translat [language]\`\n\n`;
        helpMsg += `📝 *Examples:*\n`;
        helpMsg += `• Reply to a message + \`.translat es\`\n`;
        helpMsg += `• Reply to a message + \`.translat hi\`\n`;
        helpMsg += `• Reply to a message + \`.translat fr\`\n\n`;
        helpMsg += `🌍 *Popular Languages:*\n`;
        helpMsg += `• \`en\` - English • \`es\` - Spanish\n`;
        helpMsg += `• \`fr\` - French • \`de\` - German\n`;
        helpMsg += `• \`hi\` - Hindi • \`ja\` - Japanese\n`;
        helpMsg += `• \`ko\` - Korean • \`zh\` - Chinese\n`;
        helpMsg += `• \`ar\` - Arabic • \`ru\` - Russian`;
        
        await message.reply(helpMsg);
    }

    /**
     * Send language code help
     * @param {Object} message - WhatsApp message object
     */
    async sendLanguageHelp(message) {
        let helpMsg = `🔁 *Reply Translation*\n\n`;
        helpMsg += `❗ *Missing language code*\n\n`;
        helpMsg += `📋 *Usage:* \`.translat [language]\` (while replying)\n\n`;
        helpMsg += `🌍 *Popular Languages:*\n`;
        helpMsg += `• \`en\` - English • \`es\` - Spanish\n`;
        helpMsg += `• \`fr\` - French • \`de\` - German\n`;
        helpMsg += `• \`hi\` - Hindi • \`ja\` - Japanese\n`;
        helpMsg += `• \`ko\` - Korean • \`zh\` - Chinese\n`;
        helpMsg += `• \`ar\` - Arabic • \`ru\` - Russian\n\n`;
        helpMsg += `💡 *Tip:* Reply to a message first, then use this command!`;
        
        await message.reply(helpMsg);
    }

    /**
     * Send language error message
     * @param {Object} message - WhatsApp message object
     * @param {String} invalidLang - Invalid language code provided
     */
    async sendLanguageError(message, invalidLang) {
        let errorMsg = `❌ *Invalid Language Code: \`${invalidLang}\`*\n\n`;
        errorMsg += `🌍 *Popular Language Codes:*\n`;
        errorMsg += `• \`en\` - English • \`es\` - Spanish\n`;
        errorMsg += `• \`fr\` - French • \`de\` - German\n`;
        errorMsg += `• \`hi\` - Hindi • \`ja\` - Japanese\n`;
        errorMsg += `• \`ko\` - Korean • \`zh\` - Chinese\n`;
        errorMsg += `• \`ar\` - Arabic • \`ru\` - Russian\n\n`;
        errorMsg += `💡 *Usage:* Reply to a message + \`.translat [language]\``;
        
        await message.reply(errorMsg);
    }
}

module.exports = TranslatCommand;