const Logger = require('../utils/logger');
const MODULE_NAME = 'ReactionAdd';

module.exports = {
    name: 'messageReactionAdd',
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

            Logger.info(MODULE_NAME, `Reaction added by ${user.tag} with emoji ${reaction.emoji.name}`, 'ReactionAdd');
            await client.rules.handleVerification(reaction, user);
            await client.autoRole.handleReaction(reaction, user, true);
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error handling reaction add:', error);
        }
    }
}; 