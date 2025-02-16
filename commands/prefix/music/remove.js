const Logger = require('../../../utils/logger');
const MODULE_NAME = 'RemoveCommand';

module.exports = {
    name: 'remove',
    aliases: ['rm'],
    description: 'Remove a song from the queue',
    usage: '<queue number>',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to remove without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No queue number provided', 'Validation');
                return message.reply('❌ Please provide a queue number to remove!');
            }

            const index = parseInt(args[0]) - 1;
            if (isNaN(index)) {
                Logger.warn(MODULE_NAME, `Invalid queue number provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid queue number!');
            }

            if (index < 0 || index >= player.queue.length) {
                Logger.warn(MODULE_NAME, `Queue number out of range: ${index + 1}`, 'Validation');
                return message.reply('❌ That queue number does not exist!');
            }

            const removedTrack = player.queue[index];
            player.queue.remove(index);
            Logger.success(MODULE_NAME, `Removed song at position ${index + 1}: ${removedTrack.title}`, 'QueueUpdate');

            const embed = {
                description: `✅ Removed [${removedTrack.title}](${removedTrack.uri}) from the queue`,
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error removing song:', error);
            return message.reply('❌ An error occurred while trying to remove the song!');
        }
    }
};
