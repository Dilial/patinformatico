const Logger = require('../utils/logger');
const MODULE_NAME = 'ShardError';

module.exports = {
    name: 'shardError',
    execute(client, error, shardId) {
        Logger.error(MODULE_NAME, `Shard #${shardId} Error:`, error);
    }
}; 