
const { Events, ActivityType } = require('discord.js');
const { verificationChannel, guildId, verificationRole, verificationMessage } = require('../config');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(client, reaction, user) {
        if (verificationMessage.channel !== verificationChannel || user.bot) return;

        const guild = await client.guilds.fetch(guildId);
        const member = await guild.members.fetch(user.id);
        if (!member) return;

        if (reaction.emoji.name === '✅') {
            const role = guild.roles.cache.get(verificationRole);
            if (role) {
                await member.roles.add(role);
                console.log(`${user.tag} ha sido verificado.`);
                await reaction.users.remove(member.id);
            }
        }
    },
};