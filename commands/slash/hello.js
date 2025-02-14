const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Responde con Hello!'),
  async execute(client, interaction) {
    await interaction.reply('Hello!');
  },
};