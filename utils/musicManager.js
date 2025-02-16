const { Manager } = require('erela.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger');
const MODULE_NAME = 'MusicManager';

class MusicManager {
    constructor(client) {
        this.client = client;
        this.databasePath = path.join(__dirname, '..', 'database');
        
        // Create database directory if it doesn't exist
        this.initializeDatabase();

        // Initialize Erela.js Manager with better error handling
        this.manager = new Manager({
            nodes: [
                {
                    host: "lava-v3.ajieblogs.eu.org",
                    port: 443,
                    password: "https://dsc.gg/ajidevserver",
                    secure: true,
                    retryAmount: 5,
                    retryDelay: 5000,
                    identifier: "Main Node"
                },
            ],
            send: (id, payload) => {
                const guild = client.guilds.cache.get(id);
                if (guild) guild.shard.send(payload);
            },
            autoPlay: true,
            clientName: `${client.user?.username || 'Discord Bot'}/v1.0.0`
        });

        // Add a general error handler for the manager
        this.manager.on("error", (node, error) => {
            Logger.error(MODULE_NAME, `Node error: ${error.message}`, 'NodeConnection');
        });

        // Set up Erela.js events
        this._setupEvents();

        // Add this right after creating the manager in the constructor
        this.manager.on("raw", (node, payload) => {
            // Ignore "ready" op messages
            if (payload.op === "ready") return;
            
            // Let other raw messages be processed normally
            node.send(payload);
        });

        // Handle clean shutdown and save queue state
        const cleanup = async () => {
            try {
                Logger.info(MODULE_NAME, 'Shutting down gracefully...', 'PlayerState');
                
                // Get all active players
                const players = this.manager.players;
                
                // Save state for each player
                for (const player of players.values()) {
                    try {
                        const queueState = {
                            guildId: player.guild,
                            voiceChannel: player.voiceChannel,
                            textChannel: player.textChannel,
                            queue: player.queue.map(track => ({
                                title: track.title,
                                uri: track.uri,
                                author: track.author,
                                duration: track.duration
                            })),
                            position: player.position,
                            volume: player.volume,
                            playing: player.playing,
                            paused: player.paused,
                            currentTrack: player.queue.current ? {
                                title: player.queue.current.title,
                                uri: player.queue.current.uri,
                                author: player.queue.current.author,
                                duration: player.queue.current.duration
                            } : null
                        };

                        await this.saveGuildState(player.guild, queueState);
                        Logger.success(MODULE_NAME, `Saved state for guild ${player.guild}`, 'PlayerState');
                        player.destroy();
                    } catch (error) {
                        Logger.error(MODULE_NAME, `Error saving state for guild ${player.guild}:`, error);
                    }
                }

                // Destroy the manager
                if (this.manager) {
                    await this.manager.destroy();
                }
            } catch (error) {
                Logger.error(MODULE_NAME, 'Error during cleanup:', error);
            }

            // Exit process
            process.exit(0);
        };

        // Set up cleanup handlers with proper signal handling
        process.on('SIGINT', () => {
            Logger.info(MODULE_NAME, 'Received SIGINT signal', 'General');
            cleanup();
        });
        
        process.on('SIGTERM', () => {
            Logger.info(MODULE_NAME, 'Received SIGTERM signal', 'General');
            cleanup();
        });

        // Restore queues when bot is ready
        client.once('ready', async () => {
            try {
                // Wait longer for manager to be ready
                await new Promise(resolve => setTimeout(resolve, 5000));
                Logger.info(MODULE_NAME, 'Starting queue restoration...', 'QueueUpdate');

                // Get all guild state files
                const files = await fs.readdir(this.databasePath);
                const guildFiles = files.filter(file => file.endsWith('.json'));
                Logger.info(MODULE_NAME, `Found ${guildFiles.length} guild states`, 'QueueUpdate');

                // Restore each guild's state
                for (const file of guildFiles) {
                    try {
                        const guildId = file.replace('.json', '');
                        Logger.info(MODULE_NAME, `Restoring state for guild ${guildId}`, 'QueueUpdate');
                        
                        const state = await this.loadGuildState(guildId);
                        Logger.info(MODULE_NAME, 'Loaded state:', JSON.stringify(state, null, 2));
                        
                        if (!state || !state.currentTrack) {
                            Logger.warn(MODULE_NAME, `No valid state found for guild ${guildId}`, 'QueueUpdate');
                            await this.deleteGuildState(guildId);
                            continue;
                        }

                        // Verify channels still exist and are voice channels
                        const voiceChannel = client.channels.cache.get(state.voiceChannel);
                        const textChannel = client.channels.cache.get(state.textChannel);
                        
                        Logger.info(MODULE_NAME, 'Voice channel found:', !!voiceChannel);
                        Logger.info(MODULE_NAME, 'Text channel found:', !!textChannel);
                        Logger.info(MODULE_NAME, 'Voice channel type:', voiceChannel?.type);

                        if (!voiceChannel || !textChannel || voiceChannel.type !== 2) {
                            Logger.warn(MODULE_NAME, `Invalid channels for guild ${guildId}`, 'QueueUpdate');
                            await this.deleteGuildState(guildId);
                            continue;
                        }

                        try {
                            Logger.info(MODULE_NAME, 'Creating player...', 'PlayerState');
                            // Create new player
                            const player = this.manager.create({
                                guild: guildId,
                                voiceChannel: state.voiceChannel,
                                textChannel: state.textChannel,
                                selfDeafen: true
                            });

                            // Connect to voice channel first
                            Logger.info(MODULE_NAME, 'Attempting to connect to voice channel...', 'PlayerState');
                            await player.connect();
                            Logger.success(MODULE_NAME, `Restored player for guild ${guildId}`, 'PlayerState');

                            // Wait a bit for connection to stabilize
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            // Set volume
                            player.setVolume(state.volume);
                            Logger.success(MODULE_NAME, `Set volume to ${state.volume}`, 'PlayerState');

                            // Restore current track
                            Logger.info(MODULE_NAME, 'Searching for track:', state.currentTrack.uri, 'PlayerState');
                            const results = await this.manager.search(
                                state.currentTrack.uri,
                                client.user
                            );
                            Logger.info(MODULE_NAME, 'Search results found:', results.tracks.length, 'PlayerState');

                            if (results.tracks.length > 0) {
                                // Add and play the current track
                                player.queue.add(results.tracks[0]);
                                Logger.success(MODULE_NAME, 'Track added to queue', 'PlayerState');
                                
                                await player.play();
                                Logger.success(MODULE_NAME, 'Started playback', 'PlayerState');
                                
                                // Set the correct position
                                if (state.position > 0) {
                                    await player.seek(state.position);
                                    Logger.success(MODULE_NAME, `Seeked to position ${state.position}`, 'PlayerState');
                                }

                                // Set pause state if needed
                                if (state.paused) {
                                    player.pause(true);
                                    Logger.success(MODULE_NAME, 'Set pause state', 'PlayerState');
                                }

                                // Restore the rest of the queue
                                for (const track of state.queue) {
                                    const queueResults = await this.manager.search(
                                        track.uri,
                                        client.user
                                    );
                                    if (queueResults.tracks.length > 0) {
                                        player.queue.add(queueResults.tracks[0]);
                                    }
                                }

                                Logger.success(MODULE_NAME, `Restored queue for guild ${guildId}`, 'PlayerState');

                                // Send resume message
                                const resumeEmbed = {
                                    description: `🎵 Resuming playback: [${state.currentTrack.title}](${state.currentTrack.uri})`,
                                    color: 0x00FF00
                                };
                                textChannel.send({ embeds: [resumeEmbed] }).catch(console.error);
                            } else {
                                Logger.warn(MODULE_NAME, `Could not find track for guild ${guildId}`, 'PlayerState');
                                player.destroy();
                            }

                        } catch (playerError) {
                            Logger.error(MODULE_NAME, `Error creating/connecting player for guild ${guildId}:`, playerError);
                        }

                        // Delete the state file after attempt (successful or not)
                        await this.deleteGuildState(guildId);

                    } catch (error) {
                        Logger.error(MODULE_NAME, `Error restoring guild ${file}:`, error);
                        await this.deleteGuildState(file.replace('.json', ''));
                    }
                }
            } catch (error) {
                Logger.error(MODULE_NAME, 'Error restoring queues:', error);
            }
        });
    }

    _setupEvents() {
        // Node connection events
        this.manager.on("nodeConnect", node => 
            Logger.success(MODULE_NAME, `Node ${node.options.identifier} connected`, 'NodeConnection'));
        
        this.manager.on("nodeError", (node, error) => 
            Logger.error(MODULE_NAME, `Node ${node.options.identifier} error:`, error));

        // Track events
        this.manager.on("trackStart", (player, track) => {
            Logger.info(MODULE_NAME, `Started playing: ${track.title}`, 'PlayerState');
            const channel = this.client.channels.cache.get(player.textChannel);
            if (channel) {
                const embed = {
                    description: `🎵 Now playing: [${track.title}](${track.uri})`,
                    color: 0x00ff00 // Green color
                };
                channel.send({ embeds: [embed] }).catch(console.error);
            }
        });

        this.manager.on("trackError", (player, track, error) => {
            Logger.error(MODULE_NAME, `Track error: ${error.message}`, error);
            const channel = this.client.channels.cache.get(player.textChannel);
            if (channel) {
                const embed = {
                    description: `❌ Error playing track: ${error.message}`,
                    color: 0xFF0000 // Red color
                };
                channel.send({ embeds: [embed] }).catch(console.error);
            }
        });

        this.manager.on("queueEnd", player => {
            const channel = this.client.channels.cache.get(player.textChannel);
            if (channel) {
                const embed = {
                    description: "📭 Queue ended! I'll leave in 2 minutes if no songs are added.",
                    color: 0xFFA500 // Orange color
                };
                channel.send({ embeds: [embed] }).catch(console.error);
            }

            // Disable loop when queue ends
            player.setQueueRepeat(false);

            // Set a timeout for 2 minutes
            setTimeout(() => {
                // Check if the queue is still empty after 2 minutes
                if (player.queue.size === 0 && !player.playing) {
                    const leaveEmbed = {
                        description: "👋 Leaving voice channel due to inactivity...",
                        color: 0xFFA500 // Orange color
                    };
                    channel?.send({ embeds: [leaveEmbed] }).catch(console.error);
                    player.destroy();
                }
            }, 120000); // 120000 ms = 2 minutes
        });

        // Player events
        this.manager.on("playerCreate", (player) => {
            Logger.info(MODULE_NAME, `Player created in guild ${player.guild}`);
        });

        this.manager.on("playerDestroy", (player) => {
            Logger.info(MODULE_NAME, `Player destroyed in guild ${player.guild}`);
        });

        // Handle voice connection updates
        this.client.on('voiceStateUpdate', (oldState, newState) => {
            // Get the player for this guild
            const player = this.manager.get(oldState.guild.id);
            if (!player) return;

            // Handle bot being kicked from voice channel
            if (oldState.member.id === this.client.user.id) {
                // Bot's voice state changed
                if (!newState.channel && oldState.channel) {
                    // Bot was kicked/disconnected
                    Logger.info(MODULE_NAME, `Bot was disconnected from ${oldState.channel.name}`);
                    player.destroy();
                } else if (newState.channel && oldState.channel && newState.channel.id !== oldState.channel.id) {
                    // Bot was moved to another channel
                    Logger.info(MODULE_NAME, `Bot was moved from ${oldState.channel.name} to ${newState.channel.name}`);
                    // Update player's voice channel
                    player.voiceChannel = newState.channel.id;
                } else if (newState.serverMute !== oldState.serverMute) {
                    // Bot was server muted/unmuted
                    if (newState.serverMute) {
                        Logger.info(MODULE_NAME, 'Bot was server muted');
                        player.pause(true);
                        const channel = this.client.channels.cache.get(player.textChannel);
                        if (channel) {
                            const muteEmbed = {
                                description: '🔇 Bot was muted',
                                color: 0xFF0000 // Red color
                            };
                            channel.send({ embeds: [muteEmbed] }).catch(console.error);
                        }
                    } else {
                        Logger.info(MODULE_NAME, 'Bot was server unmuted');
                        player.pause(false);
                        const channel = this.client.channels.cache.get(player.textChannel);
                        if (channel) {
                            const unmuteEmbed = {
                                description: '🔊 Bot was unmuted',
                                color: 0x00FF00 // Green color
                            };
                            channel.send({ embeds: [unmuteEmbed] }).catch(console.error);
                        }
                    }
                }
            }

            // Get the voice channel
            const voiceChannel = this.client.channels.cache.get(player.voiceChannel);
            if (!voiceChannel) return;

            // Count members in the voice channel (excluding bots)
            const members = voiceChannel.members.filter(member => !member.user.bot).size;

            if (members === 0) {
                // Start a timeout to leave if no one joins
                Logger.info(MODULE_NAME, `No users in voice channel, starting leave timeout`, 'VoiceChannel');
                
                // Clear any existing timeout
                if (player.leaveTimeout) clearTimeout(player.leaveTimeout);

                // Set new timeout
                player.leaveTimeout = setTimeout(() => {
                    // Check again if channel is still empty
                    const currentMembers = voiceChannel.members.filter(member => !member.user.bot).size;
                    if (currentMembers === 0) {
                        const channel = this.client.channels.cache.get(player.textChannel);
                        if (channel) {
                            const leaveEmbed = {
                                description: "👋 Leaving voice channel because it's empty...",
                                color: 0xFFA500
                            };
                            channel.send({ embeds: [leaveEmbed] }).catch(console.error);
                        }
                        
                        Logger.info(MODULE_NAME, `Leaving empty voice channel in ${oldState.guild.name}`, 'VoiceChannel');
                        player.destroy();
                    }
                }, 120000); // 2 minutes
            } else {
                // Clear the timeout if someone joins
                if (player.leaveTimeout) {
                    clearTimeout(player.leaveTimeout);
                    player.leaveTimeout = null;
                }
            }
        });

        // Track stuck handler
        this.manager.on("trackStuck", (player, track, payload) => {
            Logger.info(MODULE_NAME, `Track stuck: ${track.title}`);
            const channel = this.client.channels.cache.get(player.textChannel);
            if (channel) {
                const embed = {
                    description: `❌ Track stuck, skipping: ${track.title}`,
                    color: 0xFF0000 // Red color
                };
                channel.send({ embeds: [embed] }).catch(console.error);
            }
            player.stop();
        });

        this.manager.on("playerMove", (player, oldChannel, newChannel) => {
            Logger.info(MODULE_NAME, `Player moved from ${oldChannel} to ${newChannel}`, 'PlayerState');
        });
    }

    // Play a track or add it to queue
    async play(message, query) {
        const { member, guild, channel } = message;

        if (!member.voice.channel) {
            return message.reply("You need to be in a voice channel!");
        }

        // Create or get the player
        const player = this.manager.create({
            guild: guild.id,
            voiceChannel: member.voice.channel.id,
            textChannel: channel.id,
        });

        // Store current states
        const wasQueueRepeating = player.queueRepeat;
        const wasPlaying = player.playing || false;
        const wasPaused = player.paused || false;
        const currentVolume = player.volume;

        // Connect to the voice channel if not already connected
        if (!player.connected) {
            player.connect();
        }

        try {
            // Search for the track
            const res = await this.manager.search(query, message.author);

            if (res.loadType === "LOAD_FAILED") {
                const errorEmbed = {
                    description: "❌ There was an error loading the track.",
                    color: 0xFF0000
                };
                return message.channel.send({ embeds: [errorEmbed] });
            }

            if (res.loadType === "NO_MATCHES") {
                const noMatchEmbed = {
                    description: "❌ No results found!",
                    color: 0xFF0000
                };
                return message.channel.send({ embeds: [noMatchEmbed] });
            }

            // Handle different load types
            if (res.loadType === "PLAYLIST_LOADED") {
                const playlist = res.playlist;
                for (const track of res.tracks) {
                    player.queue.add(track);
                }
                const playlistEmbed = {
                    description: `📑 Added playlist ${playlist.name} with ${res.tracks.length} tracks`,
                    color: 0x00FF00
                };
                message.channel.send({ embeds: [playlistEmbed] });
            } else {
                const track = res.tracks[0];
                player.queue.add(track);
                const trackEmbed = {
                    description: `✅ Added [${track.title}](${track.uri}) to the queue`,
                    color: 0x00FF00
                };
                message.channel.send({ embeds: [trackEmbed] });
            }

            // Restore all states
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

            return player;
        } catch (error) {
            const errorEmbed = {
                description: "❌ An error occurred while playing the track!",
                color: 0xFF0000
            };
            message.channel.send({ embeds: [errorEmbed] });
            throw error;
        }
    }

    // Skip the current track and disable loop
    skip(message) {
        const player = this.manager.get(message.guild.id);
        if (!player) {
            const noPlayerEmbed = {
                description: "❌ No music is playing!",
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [noPlayerEmbed] });
        }
        
        player.setQueueRepeat(false);
        player.stop();
        
        const skipEmbed = {
            description: "⏭️ Skipped the current track!",
            color: 0x00FF00
        };
        return message.channel.send({ embeds: [skipEmbed] });
    }

    // Stop playing and clear the queue
    stop(message) {
        const player = this.manager.get(message.guild.id);
        if (!player) return message.reply("No music is playing!");
        
        player.destroy();
        
        const stopEmbed = {
            description: '⏹️ Music stopped',
            color: 0xFF0000 // Red color
        };
        return message.channel.send({ embeds: [stopEmbed] });
    }

    // Pause/resume playback
    pause(message) {
        const player = this.manager.get(message.guild.id);
        if (!player) {
            const noPlayerEmbed = {
                description: "❌ No music is playing!",
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [noPlayerEmbed] });
        }
        
        player.pause(!player.paused);
        const pauseEmbed = {
            description: player.paused ? "⏸️ Paused the music!" : "▶️ Resumed the music!",
            color: player.paused ? 0xFFA500 : 0x00FF00
        };
        return message.channel.send({ embeds: [pauseEmbed] });
    }

    // Set volume
    setVolume(message, volume) {
        const player = this.manager.get(message.guild.id);
        if (!player) {
            const noPlayerEmbed = {
                description: "❌ No music is playing!",
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [noPlayerEmbed] });
        }
        
        volume = Math.max(0, Math.min(100, volume));
        player.setVolume(volume);
        const volumeEmbed = {
            description: `🔊 Set volume to ${volume}%`,
            color: 0x00FF00
        };
        return message.channel.send({ embeds: [volumeEmbed] });
    }

    // Toggle queue repeat
    toggleRepeat(message) {
        const player = this.manager.get(message.guild.id);
        if (!player) {
            const noPlayerEmbed = {
                description: "❌ No music is playing!",
                color: 0xFF0000
            };
            return message.channel.send({ embeds: [noPlayerEmbed] });
        }
        
        player.setQueueRepeat(!player.queueRepeat);
        const repeatEmbed = {
            description: player.queueRepeat ? "🔁 Enabled queue repeat!" : "➡️ Disabled queue repeat!",
            color: player.queueRepeat ? 0x00FF00 : 0xFFA500
        };
        return message.channel.send({ embeds: [repeatEmbed] });
    }

    // Add this new method to the MusicManager class
    async searchTracks(message, query) {
        if (!message.member.voice.channel) {
            throw new Error("You need to be in a voice channel!");
        }

        try {
            // Search for tracks
            const results = await this.manager.search(query, message.author);

            if (results.loadType === "LOAD_FAILED") {
                throw new Error("Error loading tracks.");
            }

            if (results.loadType === "NO_MATCHES") {
                return [];
            }

            // Return the tracks array
            return results.tracks;
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error searching tracks:', error);
            throw error;
        }
    }

    // Initialize database directory
    async initializeDatabase() {
        try {
            await fs.mkdir(this.databasePath, { recursive: true });
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error creating database directory:', error);
        }
    }

    // Save guild state to file
    async saveGuildState(guildId, state) {
        try {
            const filePath = path.join(this.databasePath, `${guildId}.json`);
            await fs.writeFile(filePath, JSON.stringify(state, null, 2));
        } catch (error) {
            Logger.error(MODULE_NAME, `Error saving state for guild ${guildId}:`, error);
        }
    }

    // Load guild state from file
    async loadGuildState(guildId) {
        try {
            const filePath = path.join(this.databasePath, `${guildId}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            Logger.error(MODULE_NAME, `Error loading state for guild ${guildId}:`, error);
            return null;
        }
    }

    // Delete guild state file
    async deleteGuildState(guildId) {
        try {
            const filePath = path.join(this.databasePath, `${guildId}.json`);
            await fs.unlink(filePath);
        } catch (error) {
            Logger.error(MODULE_NAME, `Error deleting state for guild ${guildId}:`, error);
        }
    }
}

module.exports = MusicManager;
