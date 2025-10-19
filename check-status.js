const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

/**
 * Simple status checker for Konoha Bot
 */
class StatusChecker {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * Check if all required files exist
     */
    checkFiles() {
        const requiredFiles = [
            'package.json',
            'src/bot.js',
            'src/config.js',
            'src/sessionManager.js', 
            'src/commandHandler.js'
        ];

        console.log(chalk.blue('📁 Checking required files...'));
        let allFilesExist = true;

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                console.log(chalk.green(`✅ ${file}`));
            } else {
                console.log(chalk.red(`❌ ${file} - Missing!`));
                allFilesExist = false;
            }
        }

        return allFilesExist;
    }

    /**
     * Check if dependencies are installed
     */
    checkDependencies() {
        console.log(chalk.blue('\n📦 Checking dependencies...'));
        const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
        
        if (fs.existsSync(nodeModulesPath)) {
            console.log(chalk.green('✅ node_modules directory exists'));
            
            // Check specific dependencies
            const requiredDeps = [
                'whatsapp-web.js',
                'qrcode-terminal',
                'chalk',
                'moment',
                'fs-extra'
            ];

            let allDepsInstalled = true;
            for (const dep of requiredDeps) {
                const depPath = path.join(nodeModulesPath, dep);
                if (fs.existsSync(depPath)) {
                    console.log(chalk.green(`✅ ${dep}`));
                } else {
                    console.log(chalk.red(`❌ ${dep} - Not installed!`));
                    allDepsInstalled = false;
                }
            }
            
            return allDepsInstalled;
        } else {
            console.log(chalk.red('❌ node_modules directory not found'));
            console.log(chalk.yellow('💡 Run: npm install'));
            return false;
        }
    }

    /**
     * Check session directory
     */
    checkSessionDirectory() {
        console.log(chalk.blue('\n💾 Checking session directory...'));
        const sessionsPath = path.join(this.projectRoot, 'sessions');
        
        if (fs.existsSync(sessionsPath)) {
            console.log(chalk.green('✅ Sessions directory exists'));
            
            // Check if there's an existing session
            const files = fs.readdirSync(sessionsPath);
            const sessionFiles = files.filter(file => file.endsWith('.json'));
            
            if (sessionFiles.length > 0) {
                console.log(chalk.green(`✅ Found ${sessionFiles.length} session file(s)`));
                console.log(chalk.blue('💡 Bot will use existing session'));
            } else {
                console.log(chalk.yellow('⚠️ No session files found'));
                console.log(chalk.blue('💡 First run will require authentication'));
            }
        } else {
            console.log(chalk.yellow('⚠️ Sessions directory will be created on first run'));
        }
    }

    /**
     * Run complete system check
     */
    runSystemCheck() {
        console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════╗
║               🍃 KONOHA BOT STATUS CHECK 🍃           ║
╚══════════════════════════════════════════════════════╝
        `));

        const filesOk = this.checkFiles();
        const depsOk = this.checkDependencies();
        this.checkSessionDirectory();

        console.log(chalk.blue('\n🔍 System Check Summary:'));
        
        if (filesOk && depsOk) {
            console.log(chalk.green.bold('✅ All checks passed! Bot is ready to run.'));
            console.log(chalk.blue('\n🚀 To start the bot:'));
            console.log(chalk.cyan('   npm start'));
            console.log(chalk.cyan('   or'));
            console.log(chalk.cyan('   start.bat (Windows)'));
        } else {
            console.log(chalk.red.bold('❌ Some issues found. Please fix them before running the bot.'));
            
            if (!depsOk) {
                console.log(chalk.yellow('\n💡 To install dependencies:'));
                console.log(chalk.cyan('   npm install'));
            }
        }

        console.log(chalk.blue('\n📚 For help, check:'));
        console.log(chalk.cyan('   README.md'));
        console.log(chalk.cyan('   DOCUMENTATION.md'));
    }
}

// Run the status check
const checker = new StatusChecker();
checker.runSystemCheck();