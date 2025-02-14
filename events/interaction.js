const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(client, interaction) {
        
		if (!interaction.isChatInputCommand()) return;
        
        const command = client.slashCommands.get(interaction.commandName);
        
        if (!command) return;
        
        try {
            await command.execute(client, interaction);
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Hubo un error al ejecutar ese comando!', ephemeral: true });
        }
        
	},
};