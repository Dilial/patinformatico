const Logger = require('../utils/logger');
const MODULE_NAME = 'WarningHandler';

module.exports = {
    name: 'warn',
    execute(client, info) {
        Logger.warn(MODULE_NAME, `Discord client warning: ${info}`, 'Warning');
    }
};

