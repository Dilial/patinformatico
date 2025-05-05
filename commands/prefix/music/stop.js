const Logger = require('../../../utils/logger');
const MODULE_NAME = 'StopCommand';

module.exports = {
    name: 'stop',
    aliases: ['leave', 'disconnect'],
    description: 'Stops the music and leaves the voice channel',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to stop without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            player.queue.clear();
            player.stop();
            player.destroy();
            Logger.success(MODULE_NAME, `Music stopped in guild ${message.guild.id}`, 'Playback');
            
            const embed = {
                description: '⏹️ Stopped the music and cleared the queue',
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error stopping playback:', error);
            return message.reply('❌ An error occurred while trying to stop the music!');
        }
    }
};