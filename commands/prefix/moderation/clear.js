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

            let amount = parseInt(args[0]);

            if (isNaN(amount)) {
                Logger.warn(MODULE_NAME, `Invalid amount provided: ${args[0]}`, 'Validation');
                return message.reply('❌ Please provide a valid number!');
            }

            if (amount <= 0) {
                Logger.warn(MODULE_NAME, `Invalid amount provided: ${amount}`, 'Validation');
                return message.reply('❌ Please provide a number greater than 0!');
            }

            // Delete the command message first
            await message.delete();
            
            let totalDeleted = 0;
            let statusMessage = await message.channel.send(`🔄 Deleting messages... (0/${amount})`);

            // Process in batches of 100 (Discord API limit)
            while (amount > 0) {
                const batchSize = Math.min(100, amount);
                
                try {
                    const fetchedMessages = await message.channel.messages.fetch({ 
                        limit: batchSize, 
                        before: statusMessage.id 
                    });
                    
                    if (fetchedMessages.size === 0) break;
                    
                    const deleted = await message.channel.bulkDelete(fetchedMessages, true);
                    
                    totalDeleted += deleted.size;
                    amount -= deleted.size;
                    
                    // If we couldn't delete the expected amount, some messages must be too old
                    if (deleted.size < fetchedMessages.size) {
                        await statusMessage.edit(`⚠️ Stopped after ${totalDeleted} messages - remaining messages are older than 14 days`);
                        Logger.warn(MODULE_NAME, `Stopped at ${totalDeleted} - messages older than 14 days`, 'Execution');
                        break;
                    }
                    
                    // Update status every batch
                    await statusMessage.edit(`🔄 Deleting messages... (${totalDeleted}/${args[0]})`);
                    
                } catch (error) {
                    if (error.code === 50034) {
                        await statusMessage.edit(`⚠️ Stopped after ${totalDeleted} messages - cannot delete messages older than 14 days`);
                        break;
                    }
                    throw error;
                }
            }

            // Final status update
            await statusMessage.edit(`✅ Successfully deleted ${totalDeleted} messages!`);
            
            // Delete status message after delay
            setTimeout(() => statusMessage.delete().catch(() => {}), 5000);
            Logger.success(MODULE_NAME, `Cleared ${totalDeleted} messages in ${message.channel.name}`, 'Execution');

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing clear command:', error);
            return message.channel.send('❌ An error occurred while clearing messages!');
        }
    }
};