const Logger = require('../../../utils/logger');
const MODULE_NAME = 'SkipToCommand';

module.exports = {
    name: 'skipto',
    aliases: ['jumpto'],
    description: 'Skip to a specific song in the queue',
    usage: '<queue number>',
    category: 'music',
    run: async (client, message, args) => {
        const player = client.music.manager.get(message.guild.id);
        
        if (!player) {
            Logger.warn(MODULE_NAME, 'No active player found');
            const embed = {
                description: '❌ No music is playing!',
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [embed] });
        }

        if (!message.member.voice.channel) {
            Logger.warn(MODULE_NAME, `${message.author.tag} attempted to skipto without being in a voice channel`);
            const embed = {
                description: '❌ You need to be in a voice channel!',
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [embed] });
        }

        if (!args[0]) {
            Logger.warn(MODULE_NAME, 'No position specified');
            const embed = {
                description: '❌ Please specify the position to skip to!',
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [embed] });
        }

        const position = parseInt(args[0]) - 1;

        if (isNaN(position)) {
            Logger.warn(MODULE_NAME, `Invalid position: ${args[0]}`);
            const embed = {
                description: '❌ Please provide a valid number!',
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [embed] });
        }

        try {
            const targetTrack = player.queue[position];
            if (!targetTrack) {
                Logger.warn(MODULE_NAME, `Invalid queue position: ${position + 1}`);
                const embed = {
                    description: '❌ Invalid queue position!',
                    color: 0xFF0000
                };
                return message.channel.send({ embeds: [embed] });
            }

            player.queue.remove(0, position);
            player.stop();
            
            Logger.success(MODULE_NAME, `Skipped to position ${position + 1}`);
            const embed = {
                description: `⏭️ Skipped to [${targetTrack.title}](${targetTrack.uri})`,
                color: 0x00FF00
            };
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error in skipto command:', error);
            return message.reply('❌ An error occurred while trying to skip!');
        }
    }
};
