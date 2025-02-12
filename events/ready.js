const { Events, ActivityType, EmbedBuilder } = require('discord.js');
let { channelId } = require('../config');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		client.user.setActivity({
			type: ActivityType.Playing,
			name: 'cuack'
		})
		console.log(`Ready! Logged in as ${client.user.tag}`);
		client.application.commands.set(Array.from(client.slashCommands.values()));


		const channel = await client.channels.fetch(channelId);
    	if (!channel) console.error('Canal no encontrado.');

    	const messages = await channel.messages.fetch({ limit: 10 });
    	const existingMessage = messages.find(m => 
        	m.author.id === client.user.id && 
        	m.embeds.length > 0 && 
        	m.embeds[0].title === 'Verificación'
    	);

    	if (existingMessage) return console.log('El mensaje de verificación ya fue enviado.');

    	const embed = new EmbedBuilder()
        	.setColor('#0099ff')
        	.setTitle('Verificación')
        	.setDescription('Reacciona con ✅ para verificarte y acceder al servidor.');

		channel.send({ embeds: [embed] }).then(message => {
			message.react('✅');
		});
        
	},
};