const { Events, ActivityType } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		let time = 28*60*24*1000;

		setInterval(() => {
			client.guilds.cache.forEach(guild => {
                const channel = guild.channels.cache.find(channel => channel.name === 'parque');
                if (!channel) return;
                channel.send('cuack');
            });
        }, time);
        
	},
};