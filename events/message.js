const { Events } = require('discord.js');
const { prefix } = require('../config.js');

module.exports = {
	name: "messageCreate",
	async execute(client, message) {
        console.log('0');
        //if (!message.content.startsWith(prefix) || message.author.bot) return;
        if (message.author.bot) return;
        console.log('1');
    
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        console.log('2');
        const command = client.commands.get(commandName.replace("c!", ''))
        console.log(commandName);
        console.log('3');
        if (!command) return;
        console.log('4');
        try {
          await command.execute(message, args);
          console.log('5');
        } catch (error) {
          console.error(error);
          message.reply('Hubo un error al ejecutar ese comando!');
        }
      },
};