const chalk = require('chalk');
const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

/**
 * Analyze Command
 * Analyzes Excel files to find players below target points
 */
class AnalyzeCommand {
    constructor() {
        this.name = 'analyze';
        this.description = config.commands.analyze.description;
        this.enabled = config.commands.analyze.enabled;
        this.groupOnly = false; // Now works in both groups and personal chats
        
        // Supported Excel file formats
        this.supportedFormats = ['.xlsx', '.xls', '.csv'];
        
        // Data directory for temporary files
        this.dataDir = path.join(process.cwd(), 'data', 'excel');
        this.ensureDataDir();
    }

    /**
     * Ensure data directory exists
     */
    async ensureDataDir() {
        try {
            await fs.ensureDir(this.dataDir);
        } catch (error) {
            console.error(chalk.red('❌ Error creating data directory:', error.message));
        }
    }

    /**
     * Execute the analyze command
     * @param {Object} message - WhatsApp message object
     * @param {Array} args - Command arguments [target]
     * @param {Object} client - WhatsApp client
     * @param {Object} botInstance - Bot instance
     */
    async execute(message, args, client, botInstance) {
        try {
            // Check if target is provided
            if (args.length === 0) {
                await this.sendAnalyzeHelp(message);
                return;
            }

            const target = parseFloat(args[0]);
            
            // Validate target number
            if (isNaN(target) || target < 0) {
                await message.reply('❌ Invalid target! Please provide a valid positive number.\n\n📝 *Example:* `.analyze 30`');
                return;
            }

            // Check if message has media (Excel file)
            if (!message.hasMedia) {
                await this.sendUploadPrompt(message, target);
                return;
            }

            // Get media from message
            const media = await message.downloadMedia();
            
            if (!media) {
                await message.reply('❌ Failed to download the file. Please try again.');
                return;
            }

            // Check if it's a supported file type
            const fileName = media.filename || 'uploaded_file';
            const fileExtension = path.extname(fileName).toLowerCase();
            
            if (!this.supportedFormats.includes(fileExtension)) {
                await message.reply(`❌ Unsupported file format! Please upload:\n${this.supportedFormats.join(', ')}`);
                return;
            }

            // Process the Excel file
            await message.reply('📊 Processing Excel file... Please wait.');
            
            const analysisResult = await this.analyzeExcelFile(media, target, fileName);
            
            if (analysisResult) {
                await this.sendAnalysisResult(message, analysisResult, target);
                console.log(chalk.green(`📊 Analysis completed for target: ${target}`));
            } else {
                await message.reply('❌ Failed to analyze the Excel file. Please check the file format and try again.');
            }

        } catch (error) {
            console.error(chalk.red('❌ Error in analyze command:', error.message));
            await message.reply('❌ An error occurred while analyzing the file. Please try again.');
        }
    }

    /**
     * Analyze Excel file for players below target
     * @param {Object} media - WhatsApp media object
     * @param {Number} target - Target points threshold
     * @param {String} fileName - Original file name
     * @returns {Object|null} Analysis result object
     */
    async analyzeExcelFile(media, target, fileName) {
        try {
            // Save file temporarily
            const tempFilePath = path.join(this.dataDir, `temp_${Date.now()}_${fileName}`);
            const buffer = Buffer.from(media.data, 'base64');
            await fs.writeFile(tempFilePath, buffer);

            // Read Excel file
            const workbook = XLSX.readFile(tempFilePath);
            const sheetNames = workbook.SheetNames;
            
            if (sheetNames.length === 0) {
                throw new Error('No sheets found in Excel file');
            }

            // Use first sheet
            const worksheet = workbook.Sheets[sheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                throw new Error('No data found in Excel sheet');
            }

            // Analyze data
            const analysisResult = this.processPlayerData(jsonData, target);

            // Clean up temp file
            await fs.remove(tempFilePath);

            return {
                ...analysisResult,
                fileName: fileName,
                sheetName: sheetNames[0],
                totalRows: jsonData.length
            };

        } catch (error) {
            console.error(chalk.red('❌ Excel analysis error:', error.message));
            return null;
        }
    }

    /**
     * Process player data to find those below target
     * @param {Array} data - Excel data array
     * @param {Number} target - Target points threshold
     * @returns {Object} Processing result
     */
    processPlayerData(data, target) {
        const result = {
            belowTarget: [],
            aboveTarget: [],
            invalidEntries: [],
            summary: {
                totalPlayers: 0,
                belowCount: 0,
                aboveCount: 0,
                invalidCount: 0,
                averagePoints: 0,
                minPoints: Infinity,
                maxPoints: -Infinity
            }
        };

        // Common column name variations to check
        const nameColumns = ['name', 'player', 'username', 'member', 'player name', 'member name'];
        const pointColumns = ['points', 'score', 'total', 'points total', 'total points', 'current points'];

        // Find the correct column names
        const firstRow = data[0];
        const columns = Object.keys(firstRow).map(key => key.toLowerCase().trim());
        
        let nameColumn = null;
        let pointColumn = null;

        // Find name column
        for (const col of columns) {
            if (nameColumns.some(nameCol => col.includes(nameCol))) {
                nameColumn = Object.keys(firstRow).find(key => key.toLowerCase().trim() === col);
                break;
            }
        }

        // Find points column
        for (const col of columns) {
            if (pointColumns.some(pointCol => col.includes(pointCol))) {
                pointColumn = Object.keys(firstRow).find(key => key.toLowerCase().trim() === col);
                break;
            }
        }

        console.log(chalk.cyan(`🔍 Detected columns - Name: ${nameColumn}, Points: ${pointColumn}`));

        if (!nameColumn || !pointColumn) {
            // If auto-detection fails, use first two columns
            const keys = Object.keys(firstRow);
            nameColumn = keys[0];
            pointColumn = keys[1];
            console.log(chalk.yellow(`⚠️ Using default columns - Name: ${nameColumn}, Points: ${pointColumn}`));
        }

        let totalPoints = 0;

        // Process each row
        for (const row of data) {
            const playerName = row[nameColumn]?.toString().trim();
            const pointsValue = row[pointColumn];

            if (!playerName) {
                result.invalidEntries.push({ reason: 'Missing name', row });
                continue;
            }

            const points = parseFloat(pointsValue);
            
            if (isNaN(points)) {
                result.invalidEntries.push({ 
                    reason: 'Invalid points', 
                    name: playerName, 
                    points: pointsValue 
                });
                continue;
            }

            const playerData = {
                name: playerName,
                points: points,
                difference: points - target
            };

            // Update summary statistics
            totalPoints += points;
            result.summary.minPoints = Math.min(result.summary.minPoints, points);
            result.summary.maxPoints = Math.max(result.summary.maxPoints, points);

            // Categorize player
            if (points < target) {
                result.belowTarget.push(playerData);
                result.summary.belowCount++;
            } else {
                result.aboveTarget.push(playerData);
                result.summary.aboveCount++;
            }

            result.summary.totalPlayers++;
        }

        // Calculate average
        if (result.summary.totalPlayers > 0) {
            result.summary.averagePoints = Math.round((totalPoints / result.summary.totalPlayers) * 100) / 100;
        }

        result.summary.invalidCount = result.invalidEntries.length;

        // Sort results
        result.belowTarget.sort((a, b) => a.points - b.points); // Lowest first
        result.aboveTarget.sort((a, b) => b.points - a.points); // Highest first

        return result;
    }

    /**
     * Send analysis results to chat
     * @param {Object} message - WhatsApp message object
     * @param {Object} result - Analysis result
     * @param {Number} target - Target threshold
     */
    async sendAnalysisResult(message, result, target) {
        let response = `📊 *Excel Analysis Results*\n\n`;
        response += `📄 *File:* ${result.fileName}\n`;
        response += `📋 *Sheet:* ${result.sheetName}\n`;
        response += `🎯 *Target:* ${target} points\n\n`;

        // Summary statistics
        response += `📈 *Summary:*\n`;
        response += `• Total Players: ${result.summary.totalPlayers}\n`;
        response += `• Below Target: ${result.summary.belowCount} (${Math.round((result.summary.belowCount / result.summary.totalPlayers) * 100)}%)\n`;
        response += `• Above Target: ${result.summary.aboveCount} (${Math.round((result.summary.aboveCount / result.summary.totalPlayers) * 100)}%)\n`;
        response += `• Average Points: ${result.summary.averagePoints}\n`;
        response += `• Range: ${result.summary.minPoints} - ${result.summary.maxPoints}\n\n`;

        // Players below target
        if (result.belowTarget.length > 0) {
            response += `🔻 *Players Below Target (${result.belowTarget.length}):*\n`;
            
            const maxDisplay = 20; // Limit display to prevent message overflow
            const playersToShow = result.belowTarget.slice(0, maxDisplay);
            
            playersToShow.forEach((player, index) => {
                const deficit = target - player.points;
                response += `${index + 1}. ${player.name} - ${player.points} pts (${deficit} short)\n`;
            });

            if (result.belowTarget.length > maxDisplay) {
                response += `... and ${result.belowTarget.length - maxDisplay} more players\n`;
            }
        } else {
            response += `🎉 *Excellent!* All players meet the target!\n`;
        }

        // Invalid entries warning
        if (result.summary.invalidCount > 0) {
            response += `\n⚠️ *Warning:* ${result.summary.invalidCount} entries skipped due to invalid data\n`;
        }

        response += `\n🤖 *Analyzed by ${config.botName}*`;

        await message.reply(response);

        // Send detailed list if there are many players below target
        if (result.belowTarget.length > 20) {
            await this.sendDetailedList(message, result.belowTarget, target);
        }
    }

    /**
     * Send detailed list for large results
     * @param {Object} message - WhatsApp message object
     * @param {Array} players - Players below target
     * @param {Number} target - Target threshold
     */
    async sendDetailedList(message, players, target) {
        const chunks = [];
        let currentChunk = `📋 *Complete List - Below Target:*\n\n`;
        
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const line = `${i + 1}. ${player.name} - ${player.points} pts\n`;
            
            if ((currentChunk + line).length > 1500) {
                chunks.push(currentChunk);
                currentChunk = `📋 *Continued...*\n\n${line}`;
            } else {
                currentChunk += line;
            }
        }
        
        if (currentChunk.length > 30) {
            chunks.push(currentChunk);
        }

        // Send chunks with delay
        for (const chunk of chunks) {
            await message.reply(chunk);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
    }

    /**
     * Send help for analyze command
     * @param {Object} message - WhatsApp message object
     */
    async sendAnalyzeHelp(message) {
        let helpMsg = `📊 *Excel Analysis Help*\n\n`;
        helpMsg += `🎯 *Purpose:* Find players below target points from Excel file\n\n`;
        helpMsg += `📋 *Usage:* \`.analyze [target]\` + Excel file\n\n`;
        helpMsg += `📂 *Supported Files:*\n`;
        helpMsg += `• .xlsx (Excel 2007+)\n`;
        helpMsg += `• .xls (Excel 97-2003)\n`;
        helpMsg += `• .csv (Comma Separated)\n\n`;
        helpMsg += `📝 *Excel Format:*\n`;
        helpMsg += `• Column 1: Player Name\n`;
        helpMsg += `• Column 2: Points/Score\n`;
        helpMsg += `• Headers: name, points (auto-detected)\n\n`;
        helpMsg += `💡 *Examples:*\n`;
        helpMsg += `• \`.analyze 30\` + upload file\n`;
        helpMsg += `• \`.analyze 50\` + upload file\n\n`;
        helpMsg += `✨ *Features:*\n`;
        helpMsg += `• Auto-detects column names\n`;
        helpMsg += `• Shows detailed statistics\n`;
        helpMsg += `• Lists players below target\n`;
        helpMsg += `• Calculates averages & ranges\n\n`;
        helpMsg += `📤 *How to use:*\n`;
        helpMsg += `1. Type \`.analyze [number]\`\n`;
        helpMsg += `2. Upload your Excel file\n`;
        helpMsg += `3. Get instant analysis!`;

        await message.reply(helpMsg);
    }

    /**
     * Send upload prompt with target
     * @param {Object} message - WhatsApp message object
     * @param {Number} target - Target points
     */
    async sendUploadPrompt(message, target) {
        let promptMsg = `📊 *Excel Analysis Ready*\n\n`;
        promptMsg += `🎯 *Target:* ${target} points\n\n`;
        promptMsg += `📤 *Please upload your Excel file now*\n\n`;
        promptMsg += `📂 *Supported formats:* ${this.supportedFormats.join(', ')}\n\n`;
        promptMsg += `💡 *Tip:* Make sure your Excel file has:\n`;
        promptMsg += `• Player names in first column\n`;
        promptMsg += `• Points/scores in second column\n\n`;
        promptMsg += `⏳ *Upload the file and the analysis will start automatically!*`;

        await message.reply(promptMsg);
    }
}

module.exports = AnalyzeCommand;