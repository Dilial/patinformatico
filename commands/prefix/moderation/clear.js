const Logger = require('../../../utils/logger');
const MODULE_NAME = 'ClearCommand';

module.exports = {
    name: 'clear',
    aliases: ['purge', 'prune'],
    description: 'Clear a specified number of messages',
    usage: '<number of messages>',
    category: 'moderation',
    permissions: ['MANAGE_MESSAGES'],
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Clear command executed', 'Execution');

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No amount specified', 'Validation');
                return message.reply('❌ Please specify the number of messages to clear!');
            }

            const amount = parseInt(args[0]);

            if (isNaN(amount)) {
                Logger.warn(MODULE_NAME, `Invalid amount provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid number!');
            }

            if (amount <= 0 || amount > 100) {
                Logger.warn(MODULE_NAME, `Amount out of range: ${amount}`, 'Validation');
                return message.reply('❌ Please provide a number between 1 and 100!');
            }

            await message.delete();
            const deleted = await message.channel.bulkDelete(amount, true);
            Logger.success(MODULE_NAME, `Cleared ${deleted.size} messages in ${message.channel.name}`, 'Execution');

            const reply = await message.channel.send(`✅ Cleared ${deleted.size} messages!`);
            setTimeout(() => reply.delete().catch(() => {}), 3000);

        } catch (error) {
            if (error.code === 50034) {
                Logger.warn(MODULE_NAME, 'Attempted to delete messages older than 14 days', 'Validation');
                return message.reply('❌ Cannot delete messages older than 14 days!');
            }
            Logger.error(MODULE_NAME, 'Error executing clear command:', error);
            return message.reply('❌ An error occurred while clearing messages!');
        }
    }
};