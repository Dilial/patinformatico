const mongoose = require('mongoose');
const Warn = require('../../../models/warns'); // Import the warns model
const Logger = require('../../../utils/logger');
const MODULE_NAME = 'WarnsCommand';

module.exports = {
    name: 'warns',
    aliases: ['warnings'],
    description: 'Show the warnings of a user',
    usage: '<user>',
    category: 'moderation',
    permissions: ['BanMembers'],
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Warns command executed', 'Execution');

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No user specified', 'Validation');
                return message.reply('❌ Please specify the user to check warnings for!');
            }

            const user = message.mentions.users.first();

            if (!user) {
                Logger.warn(MODULE_NAME, `Invalid user provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid user!');
            }

            // Retrieve warnings from the database
            const warnData = await Warn.findOne({ guildId: message.guild.id, userId: user.id });

            if (!warnData || warnData.warns.length === 0) {
                return message.channel.send(`❌ ${user.username} has no warnings.`);
            }

            const warnsList = warnData.warns.map((warn, index) => `${index + 1}: ${warn}`).join('\n');
            message.channel.send(`📜 Warnings for ${user.username}:\n${warnsList}`);

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing warns command:', error);
            return message.reply('❌ An error occurred while retrieving the warnings!');
        }
    }
};
