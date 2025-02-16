const { channelId, guildId, roleId } = require('../config');
const Logger = require('../utils/logger');
const MODULE_NAME = 'ReactionHandler';

module.exports = {
    name: 'messageReactionAdd',
    async execute(client, reaction, user) {
        if (user.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();
            if (reaction.message.partial) await reaction.message.fetch();

            if (reaction.message.channelId !== channelId) return;

            const guild = await client.guilds.fetch(guildId);
            const member = await guild.members.fetch(user.id);
            if (!member) {
                Logger.warn(MODULE_NAME, `Member not found: ${user.tag}`);
                return;
            }

            if (reaction.emoji.name === '✅') {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    await member.roles.add(role);
                    Logger.success(MODULE_NAME, `Verified user: ${user.tag}`);
                    await reaction.users.remove(user.id);
                } else {
                    Logger.error(MODULE_NAME, `Verification role not found: ${roleId}`);
                }
            }
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error handling reaction:', error);
        }
    },
};