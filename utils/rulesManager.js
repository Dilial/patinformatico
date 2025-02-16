const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger');
const MODULE_NAME = 'RulesManager';

class RulesManager {
    constructor(client) {
        this.client = client;
        this.rules = new Map();
        this.loadRules();
    }

    async loadRules() {
        try {
            const databasePath = path.join(__dirname, '..', 'database');
            const files = await fs.readdir(databasePath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const guildId = file.replace('.json', '');
                    const data = await fs.readFile(path.join(databasePath, file), 'utf8');
                    const config = JSON.parse(data);

                    if (config.rulesChannel && config.rulesMessageId) {
                        const rulesPath = path.join(databasePath, `${guildId}.txt`);
                        let rulesText = '';

                        try {
                            rulesText = await fs.readFile(rulesPath, 'utf8');
                        } catch (error) {
                            Logger.warn(MODULE_NAME, `Rules text file not found for guild ${guildId}`, 'Loading');
                            continue;
                        }

                        this.rules.set(guildId, {
                            channelId: config.rulesChannel,
                            messageId: config.rulesMessageId,
                            text: rulesText,
                            verificationRequired: config.verificationRequired || false,
                            verificationEmoji: config.verificationEmoji || '✅',
                            verificationRole: config.verificationRole,
                            embed: {
                                title: config.embed?.title || 'Rules',
                                color: config.embed?.color || 0x00FF00,
                                footer: config.embed?.footer || null
                            }
                        });
                    }
                }
            }

            Logger.success(MODULE_NAME, `Loaded rules for ${this.rules.size} guilds`, 'Loading');
            this.updateAllRules();
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error loading rules:', error);
        }
    }

    async updateAllRules() {
        for (const [guildId, ruleData] of this.rules) {
            try {
                const guild = this.client.guilds.cache.get(guildId);
                if (!guild) continue;

                const channel = guild.channels.cache.get(ruleData.channelId);
                if (!channel) {
                    Logger.warn(MODULE_NAME, `Rules channel not found in guild ${guildId}`, 'Update');
                    continue;
                }

                const embed = {
                    title: ruleData.embed.title,
                    description: ruleData.text,
                    color: ruleData.embed.color
                };

                if (ruleData.embed.footer) {
                    embed.footer = { text: ruleData.embed.footer };
                }

                try {
                    const message = await channel.messages.fetch(ruleData.messageId);
                    await message.edit({ embeds: [embed] });
                    
                    // Only add verification emoji if it's not already there
                    if (ruleData.verificationRequired) {
                        const verificationReaction = message.reactions.cache.find(r => 
                            r.emoji.name === ruleData.verificationEmoji
                        );
                        
                        if (!verificationReaction) {
                            await message.react(ruleData.verificationEmoji);
                        }
                    }
                    
                    Logger.success(MODULE_NAME, `Updated rules message in guild ${guildId}`, 'Update');
                } catch (error) {
                    if (error.code === 10008) { // Message not found
                        const newMessage = await channel.send({ embeds: [embed] });
                        if (ruleData.verificationRequired) {
                            await newMessage.react(ruleData.verificationEmoji);
                        }
                        ruleData.messageId = newMessage.id;
                        await this.updateConfig(guildId, newMessage.id);
                        Logger.info(MODULE_NAME, `Created new rules message in guild ${guildId}`, 'Update');
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                Logger.error(MODULE_NAME, `Error updating rules for guild ${guildId}:`, error);
            }
        }
    }

    async handleVerification(reaction, user) {
        try {
            const guildId = reaction.message.guild.id;
            const ruleData = this.rules.get(guildId);

            if (!ruleData || !ruleData.verificationRequired) return;
            if (reaction.message.id !== ruleData.messageId) return;
            if (reaction.emoji.name !== ruleData.verificationEmoji) return;
            if (user.bot) return;

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(ruleData.verificationRole);

            if (!role) {
                Logger.warn(MODULE_NAME, `Verification role not found in guild ${guildId}`, 'Verification');
                return;
            }

            if (!member.roles.cache.has(role.id)) {
                await member.roles.add(role);
                Logger.success(MODULE_NAME, `Verified user: ${user.tag}`, 'Verification');
            }
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error handling verification:', error);
        }
    }

    async updateConfig(guildId, messageId) {
        try {
            const configPath = path.join(__dirname, '..', 'database', `${guildId}.json`);
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            
            config.rulesMessageId = messageId;
            
            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            Logger.success(MODULE_NAME, `Updated config for guild ${guildId}`, 'Config');
        } catch (error) {
            Logger.error(MODULE_NAME, `Error updating config for guild ${guildId}:`, error);
        }
    }
}

module.exports = RulesManager; 