const Logger = require('../../../utils/logger');
const MODULE_NAME = 'LoopQueueCommand';

module.exports = {
    name: 'loopqueue',
    aliases: ['lq', 'repeatqueue'],
    description: 'Toggle queue loop mode',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to toggle loop without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            if (message.member.voice.channel.id !== player.voiceChannel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to toggle loop from different voice channel`, 'Validation');
                return message.reply('❌ You need to be in the same voice channel as the bot!');
            }

            // Toggle queue repeat mode
            player.queueRepeat = !player.queueRepeat;
            // Ensure track repeat is disabled when queue repeat is enabled
            if (player.queueRepeat) player.trackRepeat = false;

            const embed = {
                description: `🔄 Queue loop mode: ${player.queueRepeat ? '**Enabled**' : '**Disabled**'}`,
                color: player.queueRepeat ? 0x00FF00 : 0xFF0000
            };

            Logger.success(MODULE_NAME, `Queue loop ${player.queueRepeat ? 'enabled' : 'disabled'} in ${message.guild.name}`, 'Toggle');
            return message.channel.send({ embeds: [embed] });

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error toggling queue loop:', error);
            return message.reply('❌ An error occurred while toggling queue loop!');
        }
    }
};
