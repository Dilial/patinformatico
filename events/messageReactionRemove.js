const Logger = require('../utils/logger');
const MODULE_NAME = 'ReactionRemove';

module.exports = {
    name: 'messageReactionRemove',
    async execute(client, reaction, user) {
        try {
            // If the reaction is partial, fetch it
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    Logger.error(MODULE_NAME, 'Error fetching partial reaction:', error);
                    return;
                }
            }

            // If the message is partial, fetch it
            if (reaction.message.partial) {
                try {
                    await reaction.message.fetch();
                } catch (error) {
                    Logger.error(MODULE_NAME, 'Error fetching partial message:', error);
                    return;
                }
            }

            Logger.info(MODULE_NAME, `Reaction removed by ${user.tag} with emoji ${reaction.emoji.name}`, 'ReactionRemove');
            await client.autoRole.handleReaction(reaction, user, false);
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error handling reaction remove:', error);
        }
    }
}; 