const Warn = require('../../../models/warns'); // Import the warns model
const Logger = require('../../../utils/logger');
const MODULE_NAME = 'WarnCommand';

module.exports = {
    name: 'warn',
    aliases: ['warn'],
    description: 'Warn a user',
    usage: '<user_id|mention> [reason]',
    category: 'moderation',
    permissions: ['BanMembers'],
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Warn command executed', 'Execution');

            if (!args[0]) {
                Logger.warn(MODULE_NAME, 'No user specified', 'Validation');
                return message.reply('❌ Please specify the user ID or mention to warn!');
            }

            // Check if the first argument is a mention or a user ID
            const userId = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0];
            const user = await message.guild.members.fetch(userId).catch(() => null); // Fetch user by ID

            if (!user) {
                Logger.warn(MODULE_NAME, `Invalid user provided: ${userId}`, 'Validation');
                return message.reply('❌ Please provide a valid user ID or mention!');
            }

            // Join the remaining arguments as the reason, defaulting to 'No reason provided' if none is given
            const reason = args.slice(1).join(' ') || 'No reason provided';

            // Add warning to the database
            const warnData = await Warn.findOne({ guildId: message.guild.id, userId: user.id });
            if (warnData) {
                warnData.warns.push(reason); // Add the reason to the existing warns
                await warnData.save();
            } else {
                // Create a new entry if the user doesn't exist in the database
                const newWarn = new Warn({
                    guildId: message.guild.id,
                    userId: user.id,
                    warns: [reason]
                });
                await newWarn.save();
            }

            // Create an embed message
            const embed = {
                title: '⚠️ User Warned',
                description: `User: ${user.user.tag}\nReason: ${reason}`,
                color: 0xffcc00,
                footer: { text: 'This warning has been logged.' }
            };

            const reply = await message.channel.send({ embeds: [embed] });

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error executing warn command:', error);
            return message.reply('❌ An error occurred while warning the user!');
        }
    }
};