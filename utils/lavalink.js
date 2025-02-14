import { Manager } from 'erela.js';

let client;

const lavaManager = new Manager({
    nodes: [
      {
        host: "lava-v3.ajieblogs.eu.org", // Lavalink se está ejecutando en localhost
        port: 443,         // El puerto que configuraste en Lavalink
        password: "https://dsc.gg/ajidevserver", // La contraseña debe ser la misma que en el archivo application.yml
        secure: true,      // Usamos false porque es localhost
      },
    ],
    send(id, payload) {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    },
  });

export const initLavaManager = (discordClient) => {
  client = discordClient;
  lavaManager.init(client.user.id);
};

export default lavaManager;
