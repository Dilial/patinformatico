const { Events, ActivityType, EmbedBuilder } = require('discord.js');
let { verificationMessage } = require('../config');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setActivity({
			type: ActivityType.Playing,
			name: 'cuack'
		})
		console.log(`Ready! Logged in as ${client.user.tag}`);


		const channel = client.channels.cache.get("1339289605475799173");
        if (!channel) return console.error('Canal no encontrado.');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Verificación')
            .setDescription('Reacciona con ✅ para verificarte y acceder al servidor.');

        channel.send({ embeds: [embed] }).then(message => {
			message.react('✅');
			verificationMessage = message.id;
		});

		
        
	},
};