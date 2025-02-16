const { Events } = require('discord.js');
const Logger = require('../utils/logger');
const MODULE_NAME = 'RepetitiveTask';

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		const time = 2 * 60 * 24 * 1000; // 2 days in milliseconds

		setInterval(() => {
			client.guilds.cache.forEach(guild => {
				const channel = guild.channels.cache.find(channel => channel.name === 'parque');
				if (!channel) {
					Logger.warn(MODULE_NAME, `Channel 'parque' not found in guild: ${guild.name}`);
					return;
				}
				Logger.info(MODULE_NAME, `Sending periodic message in guild: ${guild.name}`);
				channel.send('cuack').catch(error => {
					Logger.error(MODULE_NAME, `Error sending message in guild ${guild.name}:`, error);
				});
			});
		}, time);
		
		Logger.success(MODULE_NAME, 'Repetitive task initialized');
	},
};