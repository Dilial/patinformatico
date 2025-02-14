module.exports = {
    name: 'stop',
    run: async (client, message, args) => {
        const queue = client.distube.getQueue(message.guild.id);
        if (!queue) return message.reply('No hay música reproduciéndose.');
        queue.stop();
        message.channel.send('Música detenida y cola vaciada.');
    }
};