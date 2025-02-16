require('dotenv').config();

module.exports = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    channelId: process.env.verificationChannel,
    roleId: process.env.verificationRole,
    prefix: process.env.prefix,
    instagramToken: process.env.INSTAGRAM_TOKEN,
    instagramUsername: process.env.INSTAGRAM_USERNAME,
    instagramPassword: process.env.INSTAGRAM_PASSWORD,
    instagramMessageTemplate: process.env.INSTAGRAM_MESSAGE_TEMPLATE,
    instagramChannel: process.env.INSTAGRAM_CHANNEL_ID,
    instagramRoleId: process.env.INSTAGRAM_ROLE_ID,
    autoRoleChannel: process.env.autoRoleChannel,
    Logs: {
        // Event Logs
        Ready: true,
        MessageHandler: true,
        InteractionHandler: true,
        ReactionHandler: true,
        RepetitiveTask: true,
        ShutdownHandler: true,
        ReactionAdd: false,

        // Core Systems
        AutoRole: false,
        MusicManager: {
            General: true,
            NodeConnection: false,
            PlayerState: false,
            QueueUpdate: false,
            VoiceChannel: true
        },
        Instagram: {
            General: true,
            PostsFound: false,
            EmbedCreated: false,
            NotificationSent: false
        },

        // Commands
        commands: {
            // Music Commands
            Play: true,
            Pause: true,
            Resume: true,
            Stop: true,
            Skip: true,
            SkipTo: true,
            Queue: true,
            Loop: true,
            Volume: true,
            Search: true,
            Remove: true,
            Seek: true,

            // Moderation Commands
            Clear: true,
            AutoRole: true,

            // Utility Commands
            Help: true,
            Ping: true,
            Stats: false,

            // Slash Commands
            Hello: true
        },

        // Development & Debug
        CommandDeploy: true,
        CommandDelete: true,
        Debug: true
    }
}