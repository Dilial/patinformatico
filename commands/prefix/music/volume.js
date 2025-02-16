const Logger = require('../../../utils/logger');
const MODULE_NAME = 'VolumeCommand';

module.exports = {
    name: 'volume',
    aliases: ['vol'],
    description: 'Change the volume of the music (0-100)',
    usage: '<volume>',
    category: 'music',
    run: async (client, message, args) => {
        try {
            const player = client.music.manager.get(message.guild.id);
            
            if (!player) {
                Logger.warn(MODULE_NAME, 'No active player found', 'Validation');
                return message.reply('❌ No music is playing!');
            }

            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to change volume without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            if (!args.length) {
                Logger.info(MODULE_NAME, `Current volume: ${player.volume}`, 'Info');
                return message.reply(`🔊 Current volume: **${player.volume}%**`);
            }

            const volume = parseInt(args[0]);

            if (isNaN(volume)) {
                Logger.warn(MODULE_NAME, `Invalid volume value provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid number!');
            }

            if (volume < 0 || volume > 100) {
                Logger.warn(MODULE_NAME, `Volume out of range: ${volume}`, 'Validation');
                return message.reply('❌ Volume must be between 0 and 100!');
            }

            player.setVolume(volume);
            Logger.success(MODULE_NAME, `Volume set to ${volume}%`, 'VolumeChange');

            const embed = {
                description: `🔊 Volume set to **${volume}%**`,
                color: 0x00FF00
            };

            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error setting volume:', error);
            return message.reply('❌ An error occurred while trying to change the volume!');
        }
    }
};
