const Logger = require('../../../utils/logger');
const MODULE_NAME = 'QueueCommand';

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Show the current music queue',
    usage: '[page]',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            const queue = player.queue;
            Logger.info(MODULE_NAME, `Displaying queue with ${queue.length} tracks`, 'Display');

            const songs = queue.map((track, index) => {
                return `**${index + 1}.** [${track.title}](${track.uri}) - \`${formatDuration(track.duration)}\``;
            });

            const currentSong = player.queue.current;
            const embed = {
                color: 0x0099ff,
                title: '📜 Queue List',
                description: currentSong 
                    ? `**Now Playing:**\n[${currentSong.title}](${currentSong.uri}) - \`${formatDuration(currentSong.duration)}\`\n\n**Up Next:**\n${songs.join('\n') || 'No songs in queue'}`
                    : 'No songs playing',
                footer: {
                    text: `Total songs: ${queue.length}`
                }
            };

            Logger.success(MODULE_NAME, 'Queue displayed successfully', 'Display');
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error displaying queue:', error);
            return message.reply('❌ An error occurred while trying to show the queue!');
        }
    }
};

function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}
