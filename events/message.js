const { PermissionFlagsBits } = require('discord.js');
const { prefix } = require('../config');

module.exports = {
	name: "messageCreate",
	async execute(client, message) {
        
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        
    
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        
        if (!command) return;
        
        if (command.permissions) {
          if (!message.member.permissions.has(command.permissions)) return message.reply(`No tienes permisos para ejecutar este comando!`);
        }

        try {
          await command.run(client, message, args, client.manager);
        } catch (error) {
          console.error(error);
          message.reply('Hubo un error al ejecutar ese comando!');
        }
      },
};