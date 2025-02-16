const Logger = require('../../../utils/logger');
const MODULE_NAME = 'LoopCommand';

module.exports = {
    name: 'loop',
    aliases: ['repeat', 'l'],
    description: 'Toggles loop mode for the current queue',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to loop without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            const mode = args[0]?.toLowerCase();
            let description = '';
            let newQueueRepeat = player.queueRepeat;
            let newTrackRepeat = player.trackRepeat;

            switch (mode) {
                case 'track':
                case 'song':
                    newTrackRepeat = true;
                    newQueueRepeat = false;
                    description = '🔂 Now looping the current track';
                    break;
                case 'queue':
                case 'all':
                    newTrackRepeat = false;
                    newQueueRepeat = true;
                    description = '🔁 Now looping the queue';
                    break;
                case 'off':
                case 'disable':
                    newTrackRepeat = false;
                    newQueueRepeat = false;
                    description = '➡️ Loop mode disabled';
                    break;
                default:
                    // Toggle between states if no argument provided
                    if (player.trackRepeat) {
                        newTrackRepeat = false;
                        newQueueRepeat = true;
                        description = '🔁 Now looping the queue';
                    } else if (player.queueRepeat) {
                        newTrackRepeat = false;
                        newQueueRepeat = false;
                        description = '➡️ Loop mode disabled';
                    } else {
                        newTrackRepeat = true;
                        newQueueRepeat = false;
                        description = '🔂 Now looping the current track';
                    }
            }

            player.setTrackRepeat(newTrackRepeat);
            player.setQueueRepeat(newQueueRepeat);
            
            Logger.success(MODULE_NAME, `Loop mode changed - Track: ${newTrackRepeat}, Queue: ${newQueueRepeat}`, 'Configuration');
            
            const embed = {
                description: description,
                color: 0x00FF00
            };
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error setting loop mode:', error);
            return message.reply('❌ An error occurred while trying to set the loop mode!');
        }
    }
};
