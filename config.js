require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.verificationChannel,
    roleId: process.env.verificationRole,
    prefijo: process.env.prefijo,
}