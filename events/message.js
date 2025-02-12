const { Events } = require('discord.js');
const { prefix } = require('../config.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(client, message) {
		if (!message.content.startsWith(prefix) || message.author.bot) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        if (!client.commands.has(commandName)) return;

        const command = client.commands.get(commandName);
        try {
            command.execute(message, args);
        } catch (error) {
            console.error(error);
            message.reply('Hubo un error al ejecutar ese comando!');
        }
        
	},
};