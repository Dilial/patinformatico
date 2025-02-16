const Logger = require('../utils/logger');
const MODULE_NAME = 'ErrorHandler';

module.exports = {
    name: 'error',
    execute(client, error) {
        Logger.error(MODULE_NAME, 'Discord client error:', error);
    }
}; 