const fs = require('fs');
const path = require('path');
const { Client, Collection, Partials, GatewayIntentBits } = require('discord.js');
const { token, prefix } = require('./config.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message, Partials.Channel, Partials.Reaction
  ]
});

client.commands = new Collection();
client.slashCommands = new Collection();

const loadCommands = (dir, collection) => {
  const commandFiles = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(`./commands/${dir}/${file}`);
    collection.set(command.name, command);
  }
};

// Load prefix commands
loadCommands('prefix', client.commands);

// Load slash commands
loadCommands('slash', client.slashCommands);

client.once('ready', () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
  client.application.commands.set(Array.from(client.slashCommands.values()).map(cmd => cmd.data));
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