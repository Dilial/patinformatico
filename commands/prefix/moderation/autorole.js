const Logger = require('../../../utils/logger');
const MODULE_NAME = 'AutoRoleCommand';

module.exports = {
    name: 'autorole',
    description: 'Create or manage reaction roles',
    usage: 'create/modify/delete <args>',
    category: 'admin',
    permissions: ['ManageRoles'],
    run: async (client, message, args) => {
        try {
            if (!args.length) {
                Logger.warn(MODULE_NAME, 'No arguments provided', 'Validation');
                return message.reply(
                    '❌ Please provide the required arguments!\n' +
                    'Usage:\n' +
                    '`autorole create <role> <emoji> [role2] [emoji2]...`\n' +
                    '`autorole modify <messageId> <role> <emoji> [role2] [emoji2]...`\n' +
                    '`autorole delete <messageId>`'
                );
            }

            const subCommand = args[0].toLowerCase();

            switch (subCommand) {
                case 'create': {
                    if (args.length < 3) {
                        Logger.warn(MODULE_NAME, 'Insufficient arguments for create command', 'Validation');
                        return message.reply('❌ Please provide at least one role and emoji pair!');
                    }

                    const roles = [];
                    for (let i = 1; i < args.length; i += 2) {
                        const roleArg = args[i];
                        const emojiArg = args[i + 1];

                        if (!emojiArg) break;

                        const role = message.mentions.roles.first() || 
                                   message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, ''));

                        if (!role) {
                            Logger.warn(MODULE_NAME, `Invalid role provided: ${roleArg}`, 'Validation');
                            return message.reply(`❌ Could not find role: ${roleArg}`);
                        }

                        roles.push({
                            roleId: role.id,
                            emoji: emojiArg
                        });
                    }

                    if (!roles.length) {
                        Logger.warn(MODULE_NAME, 'No valid role-emoji pairs provided', 'Validation');
                        return message.reply('❌ No valid role-emoji pairs provided!');
                    }

                    await client.autoRole.createReactionRole(message.channel, roles);
                    Logger.success(MODULE_NAME, 'Reaction roles created successfully', 'Creation');
                    return message.reply('✅ Reaction roles created successfully!');
                }

                case 'modify': {
                    if (args.length < 4) {
                        Logger.warn(MODULE_NAME, 'Insufficient arguments for modify command', 'Validation');
                        return message.reply('❌ Please provide the message ID and at least one role and emoji pair!');
                    }

                    const messageId = args[1];
                    const roles = [];

                    for (let i = 2; i < args.length; i += 2) {
                        const roleArg = args[i];
                        const emojiArg = args[i + 1];

                        if (!emojiArg) break;

                        const role = message.mentions.roles.first() || 
                                   message.guild.roles.cache.get(roleArg.replace(/[<@&>]/g, ''));

                        if (!role) {
                            Logger.warn(MODULE_NAME, `Invalid role provided: ${roleArg}`, 'Validation');
                            return message.reply(`❌ Could not find role: ${roleArg}`);
                        }

                        roles.push({
                            roleId: role.id,
                            emoji: emojiArg
                        });
                    }

                    if (!roles.length) {
                        Logger.warn(MODULE_NAME, 'No valid role-emoji pairs provided', 'Validation');
                        return message.reply('❌ No valid role-emoji pairs provided!');
                    }

                    const success = await client.autoRole.modifyReactionRole(messageId, roles);
                    if (success) {
                        Logger.success(MODULE_NAME, `Modified reaction roles for message ${messageId}`, 'Modification');
                        return message.reply('✅ Reaction roles modified successfully!');
                    } else {
                        return message.reply('❌ Could not find or modify that reaction role message!');
                    }
                }

                case 'delete': {
                    if (!args[1]) {
                        Logger.warn(MODULE_NAME, 'No message ID provided for deletion', 'Validation');
                        return message.reply('❌ Please provide the message ID of the reaction role message!');
                    }

                    const success = await client.autoRole.deleteReactionRole(args[1]);
                    if (success) {
                        Logger.success(MODULE_NAME, `Reaction role message ${args[1]} deleted`, 'Deletion');
                        return message.reply('✅ Reaction role message deleted successfully!');
                    } else {
                        Logger.warn(MODULE_NAME, `Reaction role message ${args[1]} not found`, 'Deletion');
                        return message.reply('❌ Could not find that reaction role message!');
                    }
                }

                default: {
                    Logger.warn(MODULE_NAME, `Invalid subcommand: ${subCommand}`, 'Validation');
                    return message.reply('❌ Invalid command! Use `create`, `modify`, or `delete`');
                }
            }
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing autorole command:', error);
            return message.reply('❌ An error occurred while managing reaction roles!');
        }
    }
};
