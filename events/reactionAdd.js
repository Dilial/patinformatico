
const { Events, ActivityType } = require('discord.js');
const { channelId, guildId, roleId } = require('../config');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(client, reaction, user) {
        if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();
        if (reaction.message.partial) await reaction.message.fetch();

        if (reaction.message.channelId !== channelId) return;

        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(user.id);
        if (!member) return;

        if (reaction.emoji.name === '✅') {
            const role = guild.roles.cache.get(roleId);
            if (role) {
                await member.roles.add(role);
                console.log(`${user.tag} ha sido verificado.`);
                await reaction.users.remove(user.id);
            }
        }
    } catch (error) {
        console.error('Error al manejar la reacción:', error);
    }
    },
};