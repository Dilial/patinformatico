const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const Logger = require('./logger');
const MODULE_NAME = 'Instagram';

class InstagramNotifier {
    constructor(client) {
        this.client = client;
        this.lastPostTime = null;
        this.databasePath = path.join(__dirname, '..', 'database', 'instagram_last_post.json');
        this.loadLastPostTime();
        
        // Start checking for new posts every 10 minutes
        setInterval(() => this.checkNewPosts(), 10 * 60 * 1000);
        Logger.info(MODULE_NAME, 'Started post checking interval', 'General');
    }

    async getRecentPosts() {
        try {
            const username = this.client.config.instagramUsername;
            
            const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'X-IG-App-ID': '936619743392459'
                }
            });

            if (!response.data || !response.data.data || !response.data.data.user) {
                Logger.warn(MODULE_NAME, 'Invalid response format from Instagram API', 'General');
                return null;
            }

            const user = response.data.data.user;
            const timeline = user.edge_owner_to_timeline_media;

            if (!timeline || !timeline.edges) {
                Logger.warn(MODULE_NAME, 'No timeline data found', 'General');
                return null;
            }

            return timeline.edges.map(edge => ({
                id: edge.node.id,
                shortcode: edge.node.shortcode,
                timestamp: edge.node.taken_at_timestamp * 1000,
                type: this.getPostType(edge.node.__typename),
                caption: edge.node.edge_media_to_caption.edges[0]?.node.text || '',
                url: `https://www.instagram.com/${edge.node.shortcode}`,
                thumbnail: edge.node.display_url
            }));

        } catch (error) {
            if (error.response) {
                Logger.error(MODULE_NAME, `Instagram API error (${error.response.status}):`, 
                    error.response.data.message || JSON.stringify(error.response.data));
            } else {
                Logger.error(MODULE_NAME, 'Error fetching Instagram posts:', error.message);
            }
            return null;
        }
    }

    async checkNewPosts() {
        try {
            const posts = await this.getRecentPosts();
            
            if (!posts || posts.length === 0) {
                return;
            }

            const newPosts = posts.filter(post => {
                const postDate = new Date(post.timestamp).getTime();
                return !this.lastPostTime || postDate > this.lastPostTime;
            });

            if (newPosts.length > 0) {
                this.lastPostTime = new Date(newPosts[0].timestamp).getTime();
                await this.saveLastPostTime();

                for (const post of newPosts.reverse()) {
                    await this.sendNotification(post);
                }
            }
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error checking Instagram posts:', error.message);
        }
    }

    async sendNotification(post) {
        const channel = this.client.channels.cache.get(this.client.config.instagramChannel);
        if (!channel) {
            Logger.error(MODULE_NAME, `Notification channel not found! Channel ID: ${this.client.config.instagramChannel}`, 'General');
            return;
        }

        const roleId = this.client.config.instagramRoleId;
        const roleMention = roleId ? `<@&${roleId}>` : '';

        const messageContent = `New ${post.type} from ${this.client.config.instagramUsername}!\n${post.url}\n${roleMention}`;

        const embed = {
            color: 0xE1306C,
            author: {
                name: this.client.config.instagramUsername,
                icon_url: 'https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png'
            },
            description: post.caption ? post.caption.substring(0, 2048) : '',
            image: {
                url: post.thumbnail
            },
            footer: {
                text: post.type
            },
            timestamp: new Date(post.timestamp).toISOString()
        };

        try {
            await channel.send({
                content: messageContent,
                embeds: [embed]
            });
            Logger.success(MODULE_NAME, 'Notification sent successfully', 'General');
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error sending notification:', error);
        }
    }

    async loadLastPostTime() {
        try {
            const data = await fs.readFile(this.databasePath, 'utf8');
            const json = JSON.parse(data);
            this.lastPostTime = json.lastPostTime;
            Logger.success(MODULE_NAME, 'Loaded last post time from database', 'General');
        } catch (error) {
            Logger.warn(MODULE_NAME, 'No previous post time found, starting fresh', 'General');
            this.lastPostTime = null;
        }
    }

    async saveLastPostTime() {
        try {
            await fs.writeFile(this.databasePath, JSON.stringify({ lastPostTime: this.lastPostTime }));
            Logger.success(MODULE_NAME, 'Saved last post time to database', 'General');
        } catch (error) {
            Logger.error(MODULE_NAME, 'Error saving last post time:', error);
        }
    }

    getPostType(typename) {
        switch (typename) {
            case 'GraphImage': return 'Photo';
            case 'GraphVideo': return 'Video';
            case 'GraphSidecar': return 'Album';
            default: return 'Post';
        }
    }
}

module.exports = InstagramNotifier;
