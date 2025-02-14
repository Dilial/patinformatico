module.exports = {
    name: 'play',
    run: async (client, message, args, manager) => {
        const search = args.join(" ");
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply("❌ Debes estar en un canal de voz.");

        let player = manager.players.get(message.guild.id);
        if (!player) {
            player = manager.create({
                guild: message.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: message.channel.id,
                selfDeafen: true,
            });
            player.connect();
        }

        const res = await manager.search(search, message.author);
        if (!res.tracks.length) return message.reply("❌ No se encontraron resultados.");

        player.queue.add(res.tracks[0]);
        message.reply(`🎵 Añadido a la cola: **${res.tracks[0].title}**`);

        player.play();
    },
};
