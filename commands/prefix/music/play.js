const Logger = require('../../../utils/logger');
const MODULE_NAME = 'PlayCommand';

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Play a song',
    usage: '<song name/url>',
    category: 'music',
    run: async (client, message, args) => {
        try {
            if (!message.member.voice.channel) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to play without being in a voice channel`, 'Validation');
                return message.reply('❌ You need to be in a voice channel!');
            }

            if (!args.length) {
                Logger.warn(MODULE_NAME, `${message.author.tag} attempted to play without providing a song`, 'Validation');
                return message.reply('❌ Please provide a song to play!');
            }

            const query = args.join(' ');
            Logger.info(MODULE_NAME, `Searching for: ${query}`, 'Search');

            // Send searching message
            const searchingMsg = await message.channel.send(`🔍 Searching for \`${query}\`...`);

            const player = client.music.manager.create({
                guild: message.guild.id,
                voiceChannel: message.member.voice.channel.id,
                textChannel: message.channel.id,
            });

            if (!player.connected) {
                player.connect();
                Logger.info(MODULE_NAME, `Connected to voice channel in ${message.guild.name}`, 'Connection');
            }

            const result = await client.music.manager.search(query, message.author);
            Logger.info(MODULE_NAME, `Found ${result.tracks.length} tracks`, 'Search');

            if (result.loadType === "LOAD_FAILED") {
                Logger.error(MODULE_NAME, `Error loading track: ${result.exception?.message}`, 'Search');
                await searchingMsg.edit('❌ There was an error while searching!');
                return;
            }

            if (result.loadType === "NO_MATCHES") {
                Logger.warn(MODULE_NAME, `No matches found for query: ${query}`, 'Search');
                await searchingMsg.edit('❌ No results found!');
                return;
            }

            const embed = {
                color: 0x00FF00,
                timestamp: new Date()
            };

            if (result.loadType === "PLAYLIST_LOADED") {
                player.queue.add(result.tracks);
                
                embed.title = '📑 Playlist Added to Queue';
                embed.description = `**${result.playlist.name}**\n${result.tracks.length} tracks`;
                embed.fields = [
                    { name: 'Duration', value: formatDuration(result.playlist.duration), inline: true },
                    { name: 'Requested By', value: `<@${message.author.id}>`, inline: true }
                ];

                Logger.success(MODULE_NAME, `Added playlist: ${result.playlist.name} (${result.tracks.length} tracks)`, 'QueueUpdate');
                
                if (!player.playing) {
                    player.play();
                    Logger.info(MODULE_NAME, 'Started playing playlist', 'Playback');
                }
            } else {
                const track = result.tracks[0];
                player.queue.add(track);
                
                embed.title = '🎵 Added to Queue';
                embed.description = `[${track.title}](${track.uri})`;
                embed.fields = [
                    { name: 'Duration', value: formatDuration(track.duration), inline: true },
                    { name: 'Requested By', value: `<@${message.author.id}>`, inline: true }
                ];
                if (track.thumbnail) {
                    embed.thumbnail = { url: track.thumbnail };
                }

                Logger.success(MODULE_NAME, `Added track: ${track.title}`, 'QueueUpdate');
                
                if (!player.playing) {
                    player.play();
                    Logger.info(MODULE_NAME, 'Started playing track', 'Playback');
                }
            }

            await searchingMsg.edit({ content: null, embeds: [embed] });

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing play command:', error);
            message.reply('❌ An error occurred while trying to play the song!');
        }
    }
};

function formatDuration(duration) {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
}
