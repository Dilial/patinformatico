const Logger = require('../../../utils/logger');
const MODULE_NAME = 'PingCommand';

module.exports = {
  name: 'ping',
  description: 'Show bot latency',
  category: 'utils',
  run: async (client, message, args) => {
    try {
      Logger.info(MODULE_NAME, 'Ping command executed', 'Execution');
      
      const sent = await message.reply('Pinging...');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);
      
      Logger.info(MODULE_NAME, `Latency: ${latency}ms, API Latency: ${apiLatency}ms`, 'Stats');

      const embed = {
        title: '🏓 Pong!',
        fields: [
          { name: 'Bot Latency', value: `${latency}ms`, inline: true },
          { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
        ],
        color: 0x00FF00
      };

      await sent.edit({ content: null, embeds: [embed] });
      Logger.success(MODULE_NAME, 'Ping command completed', 'Execution');
    } catch (error) {
      Logger.error(MODULE_NAME, 'Error executing ping command:', error);
      return message.reply('❌ An error occurred while checking ping!');
    }
  },
};