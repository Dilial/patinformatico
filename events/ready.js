const { Events, ActivityType, EmbedBuilder } = require('discord.js');
const Logger = require('../utils/logger');
const MODULE_NAME = 'Ready';
let { channelId } = require('../config');

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		Logger.success(MODULE_NAME, `Logged in as ${client.user.tag}`, 'Initialization');
		Logger.info(MODULE_NAME, `Serving ${client.guilds.cache.size} guilds`, 'Stats');
		Logger.info(MODULE_NAME, `Loaded ${client.commands.size} commands`, 'Stats');
		
		// Set bot status
		client.user.setActivity('music | /help', { type: 'LISTENING' });
		Logger.info(MODULE_NAME, 'Bot status updated', 'Status');

		const channel = await client.channels.fetch(channelId);
    	if (!channel) Logger.error(MODULE_NAME, 'Canal no encontrado.');

    	const messages = await channel.messages.fetch({ limit: 10 });
    	const existingMessage = messages.find(m => 
        	m.author.id === client.user.id && 
        	m.embeds.length > 0 && 
        	m.embeds[0].title === 'Verificación'
    	);

    	if (existingMessage) {
    		Logger.info(MODULE_NAME, 'El mensaje de verificación ya fue enviado.');
    		return;
    	}

    	const embed = new EmbedBuilder()
        	.setColor('#0099ff')
        	.setTitle('Verificación')
        	.setDescription('Reacciona con ✅ para verificarte y acceder al servidor.');

		channel.send({ embeds: [embed] }).then(message => {
			message.react('✅');
			Logger.success(MODULE_NAME, 'Verification message sent and reaction added');
		});
	},
};