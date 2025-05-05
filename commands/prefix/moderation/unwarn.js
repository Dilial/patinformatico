const mongoose = require('mongoose');
const Warn = require('../../../models/warns'); // Import the warns model
const Logger = require('../../../utils/logger');
const MODULE_NAME = 'UnwarnCommand';

module.exports = {
    name: 'unwarn',
    aliases: ['removewarn'],
    description: 'Remove a warning from a user',
    usage: '<user> <warn_number>',
    category: 'moderation',
    permissions: ['BanMembers'],
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Unwarn command executed', 'Execution');

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No user specified', 'Validation');
                return message.reply('❌ Please specify the user to unwarn!');
            }

            const user = message.mentions.users.first();

            if (!user) {
                Logger.warn(MODULE_NAME, `Invalid user provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid user!');
            }

            if (!args[1] || isNaN(args[1])) {
                Logger.warn(MODULE_NAME, 'No valid warn number specified', 'Validation');
                return message.reply('❌ Please provide a valid warning number to remove!');
            }

            const warnData = await Warn.findOne({ guildId: message.guild.id, userId: user.id });

            if (!warnData || warnData.warns.length === 0) {
                return message.reply(`❌ ${user.username} has no warnings to remove.`);
            }

            const warnIndex = parseInt(args[1]) - 1; // Convert to zero-based index

            if (warnIndex < 0 || warnIndex >= warnData.warns.length) {
                return message.reply('❌ Invalid warning number specified!');
            }

            // Remove the specified warning
            warnData.warns.splice(warnIndex, 1);
            await warnData.save();

            message.channel.send(`✅ Removed warning number ${args[1]} from ${user.username}.`);

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing unwarn command:', error);
            return message.reply('❌ An error occurred while removing the warning!');
        }
    }
};
