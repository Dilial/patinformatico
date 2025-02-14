const fs = require('fs');
const path = require('path');
const { initLavaManager, default: lavaManager } = require('./utils/lavalink');
const { Client, Collection, Partials, GatewayIntentBits, Events } = require('discord.js');
const { token, prefix } = require('./config.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ]
});

client.commands = new Collection();
client.slashCommands = new Collection();
client.prefix = prefix;
client.manager = lavaManager;

function loadCommands() {
  const foldersPath = path.join(__dirname, 'commands/prefix');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      client.commands.set(command.name, command);
    }
};
}

function loadSlashCommands() {
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      client.slashCommands.set(command.data.name, command);
    }
};
}

// Load prefix commands
loadCommands();

// Load slash commands
loadSlashCommands();

client.once('ready', () => {
  initLavaManager(client); // Initialize Lavalink with the client instance
  client.application.commands.set(Array.from(client.slashCommands.values()).map(cmd => cmd.data));
  
  // Mover los manejadores de eventos de Lavalink aquí
  lavaManager.on("nodeConnect", () => console.log("✅ Conectado a Lavalink"));
  lavaManager.on("nodeError", (node, error) => console.log(`❌ Error: ${error.message}`));
  lavaManager.on("ready", (node) => {
    console.log(`Nodo de Lavalink está listo en ${node.uri}`);
  });
});

lavaManager.on("ready", (node) => {
  console.log("Nodo de Lavalink está listo en:", node.uri);
  console.log("Datos del nodo:", node); // Imprime los datos completos para ver qué está recibiendo el bot
});

// Event handler
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

client.login(token);