const Logger = require('../../../utils/logger');
const MODULE_NAME = 'SeekCommand';

module.exports = {
    name: 'seek',
    description: 'Seek to a position in the song',
    usage: '<time in seconds or mm:ss>',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to seek without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            const track = player.queue.current;
            if (!track) {
                Logger.warn(MODULE_NAME, 'No current track found', 'Validation');
                return message.reply('❌ No track is currently playing!');
            }

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No seek time provided', 'Validation');
                return message.reply('❌ Please provide a time to seek to (in seconds or mm:ss format)!');
            }

            let time;
            if (args[0].includes(':')) {
                // Handle mm:ss format
                const [minutes, seconds] = args[0].split(':');
                if (!minutes || !seconds || isNaN(minutes) || isNaN(seconds)) {
                    Logger.warn(MODULE_NAME, `Invalid time format provided: ${args[0]}`, 'Validation');
                    return message.reply('❌ Invalid time format! Use either seconds or mm:ss format.');
                }
                time = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000;
            } else {
                // Handle seconds format
                time = Number(args[0]) * 1000;
            }

            if (isNaN(time)) {
                Logger.warn(MODULE_NAME, `Invalid seek time provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid number or time format (mm:ss)!');
            }

            if (time >= track.duration || time < 0) {
                Logger.warn(MODULE_NAME, `Seek time out of range: ${time}ms`, 'Validation');
                return message.reply('❌ Seek time must be between 0 and song duration!');
            }

            player.seek(time);
            Logger.success(MODULE_NAME, `Seeked to ${time}ms in ${track.title}`, 'Playback');

            const embed = {
                description: `⏩ Seeked to \`${formatTime(time)}\``,
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error seeking:', error);
            return message.reply('❌ An error occurred while trying to seek!');
        }
    }
};

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}
