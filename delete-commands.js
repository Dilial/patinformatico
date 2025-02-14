const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config(); // Cargar variables de entorno desde un archivo .env

const TOKEN = process.env.TOKEN;  // Token del bot
const CLIENT_ID = process.env.CLIENT_ID; // ID del bot
const GUILD_ID = process.env.GUILD_ID; // Opcional: ID del servidor para comandos de servidor

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Eliminando comandos globales...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('✅ Comandos globales eliminados.');

        if (GUILD_ID) {
            console.log('Eliminando comandos del servidor...');
            await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] });
            console.log('✅ Comandos del servidor eliminados.');
        }
    } catch (error) {
        console.error('❌ Error al eliminar los comandos:', error);
    }
})();
