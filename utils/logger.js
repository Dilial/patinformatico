const chalk = require('chalk');
const config = require('../config');

class Logger {
    static shouldLog(module, type = 'General') {
        // Errors are always logged
        if (type === 'Error') return true;

        // Check if logs are configured
        if (!config.Logs) return false;

        // Handle nested configurations (like Instagram)
        if (typeof config.Logs[module] === 'object') {
            return config.Logs[module][type] === true;
        }

        // Handle command logs
        if (module.endsWith('Command')) {
            const commandName = module.replace('Command', '');
            return config.Logs.commands?.[commandName] === true;
        }

        // Handle general module logs
        return config.Logs[module] === true;
    }

    static log(module, message) {
        if (!this.shouldLog(module)) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.green(`[${timestamp}] [${module}] ${message}`));
    }

    static warn(module, message) {
        if (!this.shouldLog(module)) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.yellow(`[${timestamp}] [${module}] ⚠️ ${message}`));
    }

    static error(module, message, error = null) {
        // Errors are always logged regardless of config
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.red(`[${timestamp}] [${module}] ❌ ${message}`));
        if (error) {
            console.log(chalk.red('Error details:', error));
        }
    }

    static success(module, message) {
        if (!this.shouldLog(module)) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.green(`[${timestamp}] [${module}] ✅ ${message}`));
    }

    static info(module, message, type = 'General') {
        if (!this.shouldLog(module, type)) return;
        const timestamp = new Date().toLocaleTimeString();
        console.log(chalk.blue(`[${timestamp}] [${module}] ℹ️ ${message}`));
    }
}

module.exports = Logger;
