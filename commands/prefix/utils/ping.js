module.exports = {
  name: 'ping',
  description: 'Sirve para ver la latencia del Bot',
  run: async (client, message, args) => {
    message.reply(`Pong! El ping del Bot es de \`${client.ws.ping}ms\``)
  },
};