const Logger = require('../utils/logger');
const MODULE_NAME = 'DebugHandler';

module.exports = {
    name: 'debug',
    execute(client, info) {
        // Only log if debug logs are enabled in config
        if (client.config.Logs.Debug) {
            Logger.info(MODULE_NAME, info, 'Debug');
        }
    }
}; 