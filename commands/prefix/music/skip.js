const Logger = require('../../../utils/logger');
const MODULE_NAME = 'SkipCommand';

module.exports = {
    name: 'skip',
    aliases: ['s', 'next'],
    description: 'Skips the current song',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to skip without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            const currentSong = player.queue.current;
            player.stop();
            
            Logger.success(MODULE_NAME, `Skipped track: ${currentSong.title}`, 'Playback');
            const embed = {
                description: `⏭️ Skipped [${currentSong.title}](${currentSong.uri})`,
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error skipping track:', error);
            return message.reply('❌ An error occurred while trying to skip!');
        }
    }
};
