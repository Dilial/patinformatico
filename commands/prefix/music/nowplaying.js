const Logger = require('../../../utils/logger');
const MODULE_NAME = 'NowPlayingCommand';

module.exports = {
    name: 'nowplaying',
    aliases: ['np', 'current'],
    description: 'Show the current playing song',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            const track = player.queue.current;
            if (!track) {
                Logger.warn(MODULE_NAME, 'No current track found', 'Validation');
                return message.reply('❌ No track is currently playing!');
            }

            const position = player.position;
            const duration = track.duration;
            const progress = createProgressBar(position, duration);

            Logger.info(MODULE_NAME, `Displaying now playing info for: ${track.title}`, 'Display');

            const embed = {
                title: '🎵 Now Playing',
                description: `[${track.title}](${track.uri})\n\n${progress}\n\n\`${formatTime(position)} / ${formatTime(duration)}\``,
                color: 0x00FF00,
                thumbnail: {
                    url: track.thumbnail || null
                },
                fields: [
                    { name: 'Requested by', value: `<@${track.requester.id}>`, inline: true },
                    { name: 'Volume', value: `${player.volume}%`, inline: true }
                ]
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error displaying now playing info:', error);
            return message.reply('❌ An error occurred while trying to show the current song!');
        }
    }
};

function createProgressBar(current, total, length = 15) {
    const progress = Math.round((current / total) * length);
    const emptyProgress = length - progress;
    return '▬'.repeat(progress) + '🔘' + '▬'.repeat(emptyProgress);
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
} 