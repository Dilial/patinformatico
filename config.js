require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.verificationChannel,
    roleId: process.env.verificationRole,
    prefix: process.env.prefix,
    lavalinkHost: process.env.LAVALINK_HOST,
    lavalinkPort: process.env.LAVALINK_PORT,
    lavalinkPassword: process.env.LAVALINK_PASSWORD,
    lavalinkSecure: process.env.LAVALINK_SECURE,
}