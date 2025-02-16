const Logger = require('../../../utils/logger');
const MODULE_NAME = 'HelpCommand';

module.exports = {
    name: 'help',
    aliases: ['h', 'commands'],
    description: 'Show all commands or info about a specific command',
    usage: '[command name]',
    category: 'utils',
    run: async (client, message, args) => {
        try {
            Logger.info(MODULE_NAME, 'Help command executed', 'Execution');

            if (args[0]) {
                return showCommandHelp(client, message, args[0]);
            }

            const categories = new Map();
            client.commands.forEach(command => {
                // Check if user has permission to use the command
                if (command.permissions) {
                    const authorPerms = message.channel.permissionsFor(message.author);
                    if (!authorPerms || !command.permissions.every(perm => authorPerms.has(perm))) {
                        return; // Skip this command if user doesn't have permission
                    }
                }

                const category = command.category || 'Uncategorized';
                if (!categories.has(category)) {
                    categories.set(category, []);
                }
                categories.get(category).push(command);
            });

            Logger.info(MODULE_NAME, `Displaying help menu with ${categories.size} categories`, 'Display');

            const embed = {
                title: '📚 Command Categories',
                description: 'Select a category to view its commands\n' +
                           'This menu will expire in 5 minutes\n\n' +
                           Array.from(categories.keys())
                                .map((cat, index) => `${index + 1}. ${cat.charAt(0).toUpperCase() + cat.slice(1)}`)
                                .join('\n'),
                color: 0x00FF00,
                footer: { text: 'Type the number of the category you want to view' }
            };

            const helpMsg = await message.channel.send({ embeds: [embed] });

            // Create collector for responses
            const filter = m => m.author.id === message.author.id && 
                              !isNaN(m.content) && 
                              parseInt(m.content) > 0 && 
                              parseInt(m.content) <= categories.size;

            const collector = message.channel.createMessageCollector({
                filter,
                time: 300000, // 5 minutes
                max: 1
            });

            collector.on('collect', async m => {
                const categoryIndex = parseInt(m.content) - 1;
                const categoryName = Array.from(categories.keys())[categoryIndex];
                const commands = categories.get(categoryName);

                const categoryEmbed = {
                    title: `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Commands`,
                    description: `Use \`${client.prefix}help [command]\` for more info about a command`,
                    color: 0x00FF00,
                    fields: commands.map(cmd => ({
                        name: cmd.name,
                        value: `${cmd.description || 'No description provided'}\n` +
                               `Usage: \`${client.prefix}${cmd.name} ${cmd.usage || ''}\``,
                        inline: false
                    }))
                };

                Logger.success(MODULE_NAME, `Displayed commands for category: ${categoryName}`, 'Display');
                await helpMsg.edit({ embeds: [categoryEmbed] });
                
                // Try to delete the user's response
                try {
                    await m.delete();
                } catch (error) {
                    Logger.warn(MODULE_NAME, 'Could not delete user response', 'Cleanup');
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    Logger.info(MODULE_NAME, 'Help menu expired without selection', 'Timeout');
                    helpMsg.edit({ 
                        embeds: [{ 
                            title: '❌ Help Menu Expired',
                            description: 'Please run the help command again to view commands.',
                            color: 0xFF0000
                        }]
                    });
                }
            });

        } catch (error) {
            Logger.error(MODULE_NAME, 'Error displaying help menu:', error);
            return message.reply('❌ An error occurred while showing the help menu!');
        }
    }
};

async function showCommandHelp(client, message, commandName) {
    const command = client.commands.get(commandName) || 
                   client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) {
        Logger.warn(MODULE_NAME, `Command not found: ${commandName}`, 'Validation');
        return message.reply('❌ That command does not exist!');
    }

    // Check if user has permission to use the command
    if (command.permissions) {
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !command.permissions.every(perm => authorPerms.has(perm))) {
            Logger.warn(MODULE_NAME, `User ${message.author.tag} tried to view help for command without permissions: ${command.name}`, 'Permissions');
            return message.reply('❌ You do not have permission to use this command!');
        }
    }

    Logger.info(MODULE_NAME, `Displaying help for command: ${command.name}`, 'Display');

    const embed = {
        title: `Command: ${command.name}`,
        color: 0x00FF00,
        fields: [
            { name: 'Description', value: command.description || 'No description provided' },
            { name: 'Category', value: command.category || 'Uncategorized' }
        ]
    };

    if (command.aliases) {
        embed.fields.push({ name: 'Aliases', value: command.aliases.join(', ') });
    }

    if (command.usage) {
        embed.fields.push({ name: 'Usage', value: `${client.prefix}${command.name} ${command.usage}` });
    }

    if (command.permissions) {
        embed.fields.push({ name: 'Required Permissions', value: command.permissions.join(', ') });
    }

    Logger.success(MODULE_NAME, `Command help displayed for: ${command.name}`, 'Display');
    return message.channel.send({ embeds: [embed] });
}
