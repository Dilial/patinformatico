const Logger = require('../../../utils/logger');
const MODULE_NAME = 'PauseCommand';

module.exports = {
    name: 'pause',
    description: 'Pause the current song',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to pause without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            if (player.paused) {
                Logger.warn(MODULE_NAME, 'Player is already paused', 'Validation');
                return message.reply('⚠️ The music is already paused!');
            }

            player.pause(true);
            Logger.success(MODULE_NAME, 'Playback paused', 'Playback');
            
            const embed = {
                description: '⏸️ Paused the music',
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error pausing playback:', error);
            return message.reply('❌ An error occurred while trying to pause!');
        }
    }
};
