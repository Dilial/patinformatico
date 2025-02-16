const { Events } = require('discord.js');
const Logger = require('../utils/logger');
const MODULE_NAME = 'InteractionHandler';

module.exports = {
	name: 'interactionCreate',
	async execute(client, interaction) {
		try {
			if (!interaction.isCommand()) return;

			const command = client.slashCommands.get(interaction.commandName);
			if (!command) {
				Logger.warn(MODULE_NAME, `Unknown slash command attempted: ${interaction.commandName}`, 'CommandExecution');
				return;
			}

			Logger.info(MODULE_NAME, `Executing slash command: ${interaction.commandName} by ${interaction.user.tag}`, 'CommandExecution');
			await command.execute(client, interaction);
			Logger.success(MODULE_NAME, `Successfully executed slash command: ${interaction.commandName}`, 'CommandExecution');

		} catch (error) {
			Logger.error(MODULE_NAME, `Error executing slash command: ${interaction.commandName}`, error);
			
			const reply = {
				content: 'There was an error executing this command!',
				ephemeral: true
			};

			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(reply);
			} else {
				await interaction.reply(reply);
			}
		}
	},
};