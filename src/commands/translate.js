const chalk = require('chalk');
const config = require('../config');

/**
 * Translate Command
 * Translates text to different languages using Google Translate API
 */
class TranslateCommand {
    constructor() {
        this.name = 'translate';
        this.description = config.commands.translate.description;
        this.enabled = config.commands.translate.enabled;
        this.groupOnly = false; // Works in both groups and private chats
        
        // Supported language codes and their names
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
     * Execute the translate command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments [languageCode, ...text]
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if sufficient arguments provided
            if (args.length < 2) {
                await this.sendUsageHelp(message);
                return;
            }

            const targetLang = args[0].toLowerCase();
            const textToTranslate = args.slice(1).join(' ');

            // Validate language code
            if (!this.languageCodes[targetLang]) {
                await this.sendLanguageError(message, targetLang);
                return;
            }

            // Validate text length
            if (textToTranslate.length > 1000) {
                await message.reply('❌ Text too long! Please keep it under 1000 characters.');
                return;
            }

            // Perform translation
            const translation = await this.translateText(textToTranslate, targetLang);
            
            if (translation) {
                await this.sendTranslation(message, textToTranslate, translation, targetLang);
                console.log(chalk.green(`🌐 Translation sent: ${targetLang.toUpperCase()}`));
            } else {
                await message.reply('❌ Translation failed. Please try again later.');
            }
            
        } catch (error) {
            console.error(chalk.red('❌ Error in translate command:', error.message));
            await message.reply('❌ Translation service is temporarily unavailable. Please try again later.');
        }
    }

    /**
     * Translate text using multiple translation services
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
            
            // Use a free LibreTranslate instance
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
     * Fallback translation method using a simple web service
     * @param {String} text - Text to translate
     * @param {String} targetLang - Target language code
     * @returns {String|null} Translated text or null if failed
     */
    async fallbackTranslate(text, targetLang) {
        try {
            // Use a simple translation service (MyMemory API - free tier)
            const fetch = require('node-fetch');
            const encodedText = encodeURIComponent(text);
            
            // Use English as source language instead of 'auto' to avoid API errors
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
                
                // Check if translation failed or returned error
                if (translatedText.includes('INVALID SOURCE LANGUAGE') || 
                    translatedText.includes('MYMEMORY WARNING') ||
                    translatedText.toLowerCase() === text.toLowerCase()) {
                    
                    // Try with a different approach - use a direct mapping
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
     * Send the translation result
     * @param {Object} message - WhatsApp message object
     * @param {String} originalText - Original text
     * @param {String} translatedText - Translated text
     * @param {String} targetLang - Target language code
     */
    async sendTranslation(message, originalText, translatedText, targetLang) {
        const languageName = this.languageCodes[targetLang];
        
        // Check if translation contains an error message
        if (translatedText.includes('⚠️') || translatedText.includes('temporarily unavailable')) {
            await message.reply(translatedText);
            return;
        }
        
        let response = `🌐 *Translation Result*\n\n`;
        response += `📝 *Original:* ${originalText}\n\n`;
        response += `🎯 *${languageName} (${targetLang.toUpperCase()}):* ${translatedText}\n\n`;
        response += `🤖 *Translated by ${config.botName}*`;
        
        await message.reply(response);
    }

    /**
     * Send usage help message
     * @param {Object} message - WhatsApp message object
     */
    async sendUsageHelp(message) {
        let helpMsg = `🌐 *Translation Command Help*\n\n`;
        helpMsg += `📋 *Usage:* \`.translate [language] [text]\`\n\n`;
        helpMsg += `📝 *Examples:*\n`;
        helpMsg += `• \`.translate es Hello world\`\n`;
        helpMsg += `• \`.translate fr How are you?\`\n`;
        helpMsg += `• \`.translate hi Good morning\`\n\n`;
        helpMsg += `🌍 *Popular Languages:*\n`;
        helpMsg += `• \`en\` - English\n`;
        helpMsg += `• \`es\` - Spanish\n`;
        helpMsg += `• \`fr\` - French\n`;
        helpMsg += `• \`de\` - German\n`;
        helpMsg += `• \`hi\` - Hindi\n`;
        helpMsg += `• \`ja\` - Japanese\n`;
        helpMsg += `• \`ko\` - Korean\n`;
        helpMsg += `• \`zh\` - Chinese\n`;
        helpMsg += `• \`ar\` - Arabic\n`;
        helpMsg += `• \`ru\` - Russian\n\n`;
        helpMsg += `💡 *Tip:* Use \`.translate langs\` to see all supported languages!`;
        
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
        errorMsg += `💡 *Usage:* \`.translate [language] [text]\`\n`;
        errorMsg += `📝 *Example:* \`.translate es Hello world\``;
        
        await message.reply(errorMsg);
    }

    /**
     * Get supported languages count
     * @returns {Number} Number of supported languages
     */
    getSupportedLanguagesCount() {
        return Object.keys(this.languageCodes).length;
    }

    /**
     * Check if language code is supported
     * @param {String} langCode - Language code to check
     * @returns {Boolean} Whether language is supported
     */
    isLanguageSupported(langCode) {
        return this.languageCodes.hasOwnProperty(langCode.toLowerCase());
    }

    /**
     * Get all supported languages
     * @returns {Object} Object with language codes and names
     */
    getAllLanguages() {
        return this.languageCodes;
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
        
        // Common phrase translations
        const commonTranslations = {
            'hello': {
                'es': 'Hola',
                'fr': 'Bonjour',
                'de': 'Hallo',
                'hi': 'नमस्ते',
                'ja': 'こんにちは',
                'ko': '안녕하세요',
                'zh': '你好',
                'ar': 'مرحبا',
                'ru': 'Привет',
                'pt': 'Olá',
                'it': 'Ciao'
            },
            'hello world': {
                'es': 'Hola mundo',
                'fr': 'Bonjour le monde',
                'de': 'Hallo Welt',
                'hi': 'नमस्ते दुनिया',
                'ja': 'こんにちは世界',
                'ko': '안녕하세요 세계',
                'zh': '你好世界',
                'ar': 'مرحبا بالعالم',
                'ru': 'Привет мир',
                'pt': 'Olá mundo',
                'it': 'Ciao mondo'
            },
            'good morning': {
                'es': 'Buenos días',
                'fr': 'Bonjour',
                'de': 'Guten Morgen',
                'hi': 'सुप्रभात',
                'ja': 'おはようございます',
                'ko': '좋은 아침',
                'zh': '早上好',
                'ar': 'صباح الخير',
                'ru': 'Доброе утро',
                'pt': 'Bom dia',
                'it': 'Buongiorno'
            },
            'thank you': {
                'es': 'Gracias',
                'fr': 'Merci',
                'de': 'Danke',
                'hi': 'धन्यवाद',
                'ja': 'ありがとう',
                'ko': '감사합니다',
                'zh': '谢谢',
                'ar': 'شكرا',
                'ru': 'Спасибо',
                'pt': 'Obrigado',
                'it': 'Grazie'
            }
        };
        
        // Check if we have a direct translation
        if (commonTranslations[lowerText] && commonTranslations[lowerText][targetLang]) {
            return commonTranslations[lowerText][targetLang];
        }
        
        // If no translation available, return a helpful message
        return `⚠️ Translation to ${languageName} temporarily unavailable. The text "${text}" could not be translated at this time.`;
    }
}

module.exports = TranslateCommand;