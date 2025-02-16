const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const Logger = require('./utils/logger');
const MODULE_NAME = 'CommandDelete';

dotenv.config(); // Cargar variables de entorno desde un archivo .env

const TOKEN = process.env.TOKEN;  // Token del bot
const CLIENT_ID = process.env.CLIENT_ID; // ID del bot
const GUILD_ID = process.env.GUILD_ID; // Opcional: ID del servidor para comandos de servidor

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        Logger.info(MODULE_NAME, 'Starting to delete commands...');
        
        Logger.info(MODULE_NAME, 'Deleting global commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        Logger.success(MODULE_NAME, 'Global commands deleted');

        if (GUILD_ID) {
            Logger.info(MODULE_NAME, 'Deleting guild commands...');
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
            Logger.success(MODULE_NAME, 'Guild commands deleted');
        }
    } catch (error) {
        Logger.error(MODULE_NAME, 'Error deleting commands:', error);
    }
})();
