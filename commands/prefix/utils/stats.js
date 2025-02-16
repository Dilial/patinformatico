const { version } = require('discord.js');
const Logger = require('../../../utils/logger');
const MODULE_NAME = 'StatsCommand';

module.exports = {
    name: 'stats',
    aliases: ['botinfo', 'status'],
    description: 'Show bot statistics',
    category: 'utils',
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Stats command executed', 'Execution');

            const uptime = formatUptime(client.uptime);
            const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            
            const stats = {
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size,
                commands: client.commands.size + client.slashCommands.size
            };

            Logger.info(MODULE_NAME, `Collecting stats: ${JSON.stringify(stats)}`, 'Stats');

            const embed = {
                title: '📊 Bot Statistics',
                color: 0x00FF00,
                fields: [
                    { name: 'Servers', value: `${stats.guilds}`, inline: true },
                    { name: 'Users', value: `${stats.users}`, inline: true },
                    { name: 'Channels', value: `${stats.channels}`, inline: true },
                    { name: 'Commands', value: `${stats.commands}`, inline: true },
                    { name: 'Memory Usage', value: `${memoryUsage} MB`, inline: true },
                    { name: 'Uptime', value: uptime, inline: true },
                    { name: 'Discord.js', value: `v${version}`, inline: true },
                    { name: 'Node.js', value: process.version, inline: true }
                ],
                timestamp: new Date()
            };

            Logger.success(MODULE_NAME, 'Stats displayed successfully', 'Display');
            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing stats command:', error);
            return message.reply('❌ An error occurred while fetching statistics!');
        }
    }
};

function formatUptime(ms) {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}
