const { SlashCommandBuilder } = require('@discordjs/builders');
const Logger = require('../../utils/logger');
const MODULE_NAME = 'HelloCommand';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Say hello to the bot'),
  async execute(client, interaction) {
    try {
      Logger.info(MODULE_NAME, `Hello command executed by ${interaction.user.tag}`, 'Execution');

      const responses = [
        'Hello there! 👋',
        'Hi! How are you? 😊',
        'Hey! Nice to see you! ✨',
        'Greetings! 🌟',
        'Hello! Hope you\'re having a great day! 🎉'
      ];

      const response = responses[Math.floor(Math.random() * responses.length)];
      Logger.success(MODULE_NAME, `Responded with: ${response}`, 'Response');
      
      await interaction.reply({
        content: response,
        ephemeral: false
      });

    } catch (error) {
      Logger.error(MODULE_NAME, 'Error executing hello command:', error);
      await interaction.reply({
        content: '❌ An error occurred while executing this command!',
        ephemeral: true
      });
    }
  },
};