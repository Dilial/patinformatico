const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger');
const MODULE_NAME = 'AutoRole';

class AutoRole {
    constructor(client) {
        this.client = client;
        this.databasePath = path.join(__dirname, '..', 'database', 'reactionroles.json');
        this.reactionRoles = new Map();
        this.loadReactionRoles();
        Logger.info(MODULE_NAME, 'Reaction roles system initialized', 'Initialization');
    }

    async loadReactionRoles() {
        try {
            const data = await fs.readFile(this.databasePath, 'utf8');
            const roles = JSON.parse(data);
            
            for (const [messageId, roleData] of Object.entries(roles)) {
                this.reactionRoles.set(messageId, roleData);
            }
            
            Logger.success(MODULE_NAME, `Loaded ${this.reactionRoles.size} reaction role messages`, 'Loading');
        } catch (error) {
            if (error.code === 'ENOENT') {
                Logger.info(MODULE_NAME, 'No reaction roles file found, creating new one', 'Loading');
                await this.saveReactionRoles();
            } else {
                Logger.error(MODULE_NAME, 'Error loading reaction roles:', error);
            }
        }
    }

    async saveReactionRoles() {
        try {
            const rolesObject = Object.fromEntries(this.reactionRoles);
            await fs.writeFile(this.databasePath, JSON.stringify(rolesObject, null, 2));
            Logger.success(MODULE_NAME, 'Reaction roles saved successfully', 'Saving');
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error saving reaction roles:', error);
        }
    }

    async createReactionRole(channel, roles) {
        try {
            const embed = {
                title: '🎭 Role Selection',
                description: 'React to get your roles!\n\n' + 
                    roles.map(r => `${r.emoji} - <@&${r.roleId}>`).join('\n'),
                color: 0x00FF00,
                footer: { text: 'Remove your reaction to remove the role' }
            };

            const message = await channel.send({ embeds: [embed] });
            
            // Add reactions
            for (const role of roles) {
                await message.react(role.emoji);
            }

            // Save to database
            this.reactionRoles.set(message.id, {
                channelId: channel.id,
                guildId: channel.guild.id,
                roles: roles
            });
            
            await this.saveReactionRoles();
            Logger.success(MODULE_NAME, `Created reaction role message in ${channel.name}`, 'Creation');
            
            return message;
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error creating reaction role message:', error);
            throw error;
        }
    }

    async handleReaction(reaction, user, isAdd) {
        try {
            if (user.bot) return;

            const messageId = reaction.message.id;
            const roleData = this.reactionRoles.get(messageId);

            if (!roleData) {
                Logger.debug(MODULE_NAME, `No role data found for message ${messageId}`, 'ReactionHandle');
                return;
            }

            // Check if the emoji matches any role configuration
            const roleInfo = roleData.roles.find(r => {
                // Handle both custom and unicode emojis
                if (reaction.emoji.id) {
                    // For custom emojis
                    return r.emoji === reaction.emoji.id || r.emoji === `<:${reaction.emoji.name}:${reaction.emoji.id}>`;
                } else {
                    // For unicode emojis
                    return r.emoji === reaction.emoji.name;
                }
            });

            if (!roleInfo) {
                Logger.debug(MODULE_NAME, `No role configured for emoji ${reaction.emoji.name}`, 'ReactionHandle');
                return;
            }

            const guild = reaction.message.guild;
            const member = await guild.members.fetch(user.id);
            const role = await guild.roles.fetch(roleInfo.roleId);

            if (!role) {
                Logger.warn(MODULE_NAME, `Role ${roleInfo.roleId} not found in guild`, 'RoleManagement');
                return;
            }

            if (isAdd) {
                if (!member.roles.cache.has(role.id)) {
                    await member.roles.add(role);
                    Logger.success(MODULE_NAME, `Added role ${role.name} to ${user.tag}`, 'RoleAdd');
                }
            } else {
                if (member.roles.cache.has(role.id)) {
                    await member.roles.remove(role);
                    Logger.success(MODULE_NAME, `Removed role ${role.name} from ${user.tag}`, 'RoleRemove');
                }
            }
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error handling reaction:', error);
        }
    }

    async deleteReactionRole(messageId) {
        try {
            if (!this.reactionRoles.has(messageId)) {
                return false;
            }

            this.reactionRoles.delete(messageId);
            await this.saveReactionRoles();
            Logger.success(MODULE_NAME, `Deleted reaction role message ${messageId}`, 'Deletion');
            return true;
        } catch (error) {
            Logger.error(MODULE_NAME, `Error deleting reaction role message ${messageId}:`, error);
            return false;
        }
    }

    async modifyReactionRole(messageId, roles) {
        try {
            if (!this.reactionRoles.has(messageId)) {
                Logger.warn(MODULE_NAME, `Message ${messageId} not found for modification`, 'Modification');
                return false;
            }

            const roleData = this.reactionRoles.get(messageId);
            const channel = await this.client.channels.fetch(roleData.channelId);
            const message = await channel.messages.fetch(messageId);

            if (!message) {
                Logger.warn(MODULE_NAME, `Message ${messageId} not found in channel`, 'Modification');
                return false;
            }

            // Create new embed
            const embed = {
                title: '🎭 Role Selection',
                description: 'React to get your roles!\n\n' + 
                    roles.map(r => `${r.emoji} - <@&${r.roleId}>`).join('\n'),
                color: 0x00FF00,
                footer: { text: 'Remove your reaction to remove the role' }
            };

            // Remove all reactions
            await message.reactions.removeAll();

            // Update message with new embed
            await message.edit({ embeds: [embed] });

            // Add new reactions
            for (const role of roles) {
                await message.react(role.emoji);
            }

            // Update database
            this.reactionRoles.set(messageId, {
                ...roleData,
                roles: roles
            });
            
            await this.saveReactionRoles();
            Logger.success(MODULE_NAME, `Modified reaction role message ${messageId}`, 'Modification');
            
            return true;
        } catch (error) {
            Logger.error(MODULE_NAME, `Error modifying reaction role message ${messageId}:`, error);
            return false;
        }
    }
}

module.exports = AutoRole;
