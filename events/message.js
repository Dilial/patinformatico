const { Events } = require('discord.js');
const { prefix } = require('../config.js');

module.exports = {
	name: Events.MessageCreate,
	async execute(client, message) {
        if (!message.content.startsWith(client.prefix) || message.author.bot) return;
    
        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
    
        const command = client.commands.get(commandName);
    
        if (!command) return;
    
        try {
          await command.execute(message, args);
        } catch (error) {
          console.error(error);
          message.reply('Hubo un error al ejecutar ese comando!');
        }
      },
};