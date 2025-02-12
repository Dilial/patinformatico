require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    verificationChannel: process.env.CHANNEL_ID,
    verificationRole: process.env.ROLE_ID,
    verificationMessage: String,
}