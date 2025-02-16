const Logger = require('../../../utils/logger');
const MODULE_NAME = 'SearchCommand';

module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'Search for a song in different platforms',
    usage: '<song name>',
    category: 'music',
    run: async (client, message, args) => {
        if (!args.length) {
            Logger.warn(MODULE_NAME, 'No search query provided');
            return message.reply('❌ Please provide a song name to search!');
        }

        if (!message.member.voice.channel) {
            Logger.warn(MODULE_NAME, `${message.author.tag} attempted to search without being in a voice channel`);
            return message.reply('❌ You need to be in a voice channel!');
        }

        const query = args.join(' ');
        let player = null;
        
        try {
            // Define available platforms
            const platforms = [
                { name: 'YouTube', emoji: '📺', source: 'youtube' },
                { name: 'SoundCloud', emoji: '☁️', source: 'soundcloud' },
                { name: 'Spotify', emoji: '💚', source: 'spotify' }
            ];

            Logger.info(MODULE_NAME, `Searching for: "${query}"`);

            // Create platform list embed
            const embed = {
                color: 0x0099ff,
                title: '🔍 Select Search Platform',
                description: platforms.map((platform, index) => 
                    `**${index + 1}.** ${platform.emoji} ${platform.name}`
                ).join('\n') + '\n\n*Reply with the number of the platform (1-3), or "cancel" to cancel*',
                footer: { text: 'Time limit: 30 seconds' }
            };

            const platformMessage = await message.channel.send({ embeds: [embed] });

            // Create message collector for platform selection
            const filter = m => {
                const response = m.content.toLowerCase();
                return (
                    m.author.id === message.author.id && 
                    (response === 'cancel' || (parseInt(response) >= 1 && parseInt(response) <= platforms.length))
                );
            };

            try {
                const collected = await message.channel.awaitMessages({
                    filter,
                    max: 1,
                    time: 30000,
                    errors: ['time']
                });

                const response = collected.first().content.toLowerCase();
                
                // Clean up messages
                await platformMessage.delete().catch(() => {});
                await collected.first().delete().catch(() => {});

                if (response === 'cancel') {
                    Logger.info(MODULE_NAME, 'Search cancelled by user');
                    return message.reply('Search cancelled.');
                }

                const selectedPlatform = platforms[parseInt(response) - 1];
                Logger.info(MODULE_NAME, `Selected platform: ${selectedPlatform.name}`);

                const searchMsg = await message.channel.send(`${selectedPlatform.emoji} Searching on ${selectedPlatform.name}...`);

                try {
                    // Get the player
                    player = client.music.manager.create({
                        guild: message.guild.id,
                        voiceChannel: message.member.voice.channel.id,
                        textChannel: message.channel.id,
                    });

                    // Store current states
                    const wasQueueRepeating = player.queueRepeat;
                    const wasPlaying = player.playing || false;
                    const wasPaused = player.paused || false;
                    const currentVolume = player.volume;

                    // Search for the track with platform-specific handling
                    let searchResults;
                    if (selectedPlatform.source === 'spotify') {
                        // For Spotify, try both with and without "spotify:" prefix
                        searchResults = await client.music.manager.search({
                            query: `spotify:${query}`,
                            source: selectedPlatform.source
                        }, message.author).catch(async () => {
                            // If the spotify: prefix fails, try without it
                            return await client.music.manager.search({
                                query,
                                source: selectedPlatform.source
                            }, message.author);
                        });
                    } else {
                        // For other platforms, use normal search
                        searchResults = await client.music.manager.search({
                            query,
                            source: selectedPlatform.source
                        }, message.author);
                    }

                    // Clean up search message
                    await searchMsg.delete().catch(() => {});

                    if (searchResults.loadType === "LOAD_FAILED") {
                        if (player && !player.playing) {
                            player.destroy();
                        }
                        throw new Error("Error loading track.");
                    }

                    if (searchResults.loadType === "NO_MATCHES") {
                        if (player && !player.playing) {
                            player.destroy();
                        }
                        return message.reply(`${selectedPlatform.emoji} No results found on ${selectedPlatform.name}!`);
                    }

                    // Connect to voice channel if not already connected
                    if (!player.connected) {
                        player.connect();
                    }

                    // Get the first track
                    const track = searchResults.tracks[0];
                    
                    // Add the track to queue
                    player.queue.add(track);
                    message.channel.send(`${selectedPlatform.emoji} Added [${track.title}](${track.uri}) to the queue`);

                    // Restore states
                    player.setQueueRepeat(wasQueueRepeating);
                    player.setVolume(currentVolume);
                    
                    if (wasPlaying && !wasPaused) {
                        await player.pause(false);
                    } else if (wasPaused) {
                        await player.pause(true);
                    }

                    // Start playing if nothing is currently playing
                    if (!player.playing && !player.paused) {
                        await player.play();
                    }

                    Logger.success(MODULE_NAME, `Search completed on ${selectedPlatform.name}`);

                } catch (error) {
                    console.error('Error playing track:', error);
                    if (player && !player.playing) {
                        player.destroy();
                    }
                    return message.reply(`❌ Error searching on ${selectedPlatform.name}!`);
                }

            } catch (error) {
                if (player && !player.playing) {
                    player.destroy();
                }
                await platformMessage.delete().catch(() => {});
                return message.reply('❌ No response received within 30 seconds, search cancelled.');
            }

        } catch (error) {
            if (player && !player.playing) {
                player.destroy();
            }
            Logger.error(MODULE_NAME, 'Error in search command:', error);
            message.reply('❌ An error occurred while searching!');
        }
    }
};
