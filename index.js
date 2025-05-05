const fs = require('fs');
const path = require('path');
const { Client, Collection, Partials, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config.js');  // Import config
const MusicManager = require('./utils/musicManager');
const InstagramNotifier = require('./utils/instagramNotifier');
const AutoRole = require('./utils/autoRole');
const Logger = require('./utils/logger');
const RulesManager = require('./utils/rulesManager');
const mongoose = require('mongoose');

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

// Attach config to client
client.config = config;
client.commands = new Collection();
client.slashCommands = new Collection();
client.prefix = config.prefix;

function loadCommands() {
  const foldersPath = path.join(__dirname, 'commands/prefix');
  const commandFolders = fs.readdirSync(foldersPath);

  Logger.info('CommandLoader', 'Loading prefix commands...', 'Initialization');
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    Logger.info('CommandLoader', `Loading ${commandFiles.length} commands from ${folder}`, 'Loading');
    
    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.name, command);
        Logger.success('CommandLoader', `Loaded command: ${command.name}`, 'Loading');
      } catch (error) {
        Logger.error('CommandLoader', `Failed to load command: ${file}`, error);
      }
    }
  }
  Logger.success('CommandLoader', 'All prefix commands loaded', 'Initialization');
}

function loadSlashCommands() {
  const foldersPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(foldersPath);

  Logger.info('CommandLoader', 'Loading slash commands...', 'Initialization');
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    Logger.info('CommandLoader', `Loading ${commandFiles.length} slash commands from ${folder}`, 'Loading');
    
    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.slashCommands.set(command.data.name, command);
        Logger.success('CommandLoader', `Loaded slash command: ${command.data.name}`, 'Loading');
      } catch (error) {
        Logger.error('CommandLoader', `Failed to load slash command: ${file}`, error);
      }
    }
  }
  Logger.success('CommandLoader', 'All slash commands loaded', 'Initialization');
}

// Load prefix commands
loadCommands();

// Load slash commands
loadSlashCommands();

mongoose.connect(config.mongoURI)
    .then(() => Logger.success('MongoDB', 'Connected to MongoDB', 'Initialization'))
    .catch(err => Logger.error('MongoDB', 'Failed to connect to MongoDB', err));

client.once('ready', async () => {
    // Initialize music manager
    client.music = new MusicManager(client);
    
    try {
        await client.music.manager.init(client.user.id);
        Logger.success('MusicManager', 'Manager initialized successfully', 'NodeConnection');
    } catch (error) {
        Logger.error('MusicManager', 'Failed to initialize manager', error);
    }
    
    // Handle raw events for voice state updates
    client.on('raw', (d) => {
        if (['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(d.t)) {
            client.music.manager.updateVoiceState(d);
            Logger.info('MusicManager', `Voice state updated: ${d.t}`, 'VoiceState');
        }
    });
    
    // Initialize auto-role system
    client.autoRole = new AutoRole(client);
    Logger.success('AutoRole', 'System initialized', 'Initialization');

    // Initialize Instagram notifier if username is provided
    /*if (client.config.instagramUsername) {
        try {
            client.instagram = new InstagramNotifier(client);
            Logger.success('Instagram', `Notifier initialized for @${client.config.instagramUsername}`, 'Initialization');
        } catch (error) {
            Logger.error('Instagram', 'Failed to initialize notifier', error);
        }
    } else {
        Logger.warn('Instagram', 'Username not provided, skipping initialization', 'Initialization');
    }*/

    // Register slash commands
    try {
        await client.application.commands.set(
            Array.from(client.slashCommands.values()).map(cmd => cmd.data)
        );
        Logger.success('CommandDeploy', 'Slash commands registered successfully');
    } catch (error) {
        Logger.error('CommandDeploy', 'Failed to register slash commands', error);
    }

    // Initialize rules manager
    client.rules = new RulesManager(client);
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

// Login to Discord with your client's token
client.login(config.token);