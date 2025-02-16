const Logger = require('../utils/logger');
const MODULE_NAME = 'MessageHandler';

module.exports = {
	name: 'messageCreate',
	async execute(client, message) {
		try {
			if (message.author.bot) return;
			
			// Check for prefix
			if (!message.content.startsWith(client.prefix)) return;

			// Parse command and arguments
			const args = message.content.slice(client.prefix.length).trim().split(/ +/);
			const commandName = args.shift().toLowerCase();

			// Get command
			const command = client.commands.get(commandName) 
				|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

			if (!command) {
				Logger.warn(MODULE_NAME, `Unknown command attempted: ${commandName}`, 'CommandExecution');
				return;
			}

			// Check permissions
			if (command.permissions) {
				const authorPerms = message.channel.permissionsFor(message.author);
				if (!authorPerms || !command.permissions.every(perm => authorPerms.has(perm))) {
					Logger.warn(MODULE_NAME, `User ${message.author.tag} attempted to use command without permissions: ${commandName}`, 'Permissions');
					return message.reply('You do not have permission to use this command!');
				}
			}

			// Execute command
			Logger.info(MODULE_NAME, `Executing command: ${commandName} by ${message.author.tag}`, 'CommandExecution');
			await command.run(client, message, args);
			Logger.success(MODULE_NAME, `Successfully executed command: ${commandName}`, 'CommandExecution');

		} catch (error) {
			Logger.error(MODULE_NAME, `Error executing command: ${message.content}`, error);
			message.reply('There was an error executing that command!');
		}
	},
};