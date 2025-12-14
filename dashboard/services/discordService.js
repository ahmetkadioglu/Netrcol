// services/discordService.js
const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

function createDiscordService(env, client) {
    const {
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI,
        SUPPORT_GUILD_ID,
        ADMIN_ROLE_ID
    } = env;

    // --- OAuth: code -> access token ---
    async function exchangeCode(code) {
        try {
            const data = {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
                scope: 'identify guilds email'
            };

            const response = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams(data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token exchange failed: ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    // --- OAuth: access token yenileme (gerekirse kullanırız) ---
    async function refreshAccessToken(refreshToken) {
        try {
            const data = {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            };

            const response = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                body: new URLSearchParams(data),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Token refresh failed: ${error}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    // --- Kullanıcı bilgisi çek ---
    async function getUserInfo(accessToken) {
        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    }

    // --- Kullanıcının guild'lerini çek ---
    async function getUserGuilds(accessToken) {
        try {
            const response = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch guilds: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get guilds error:', error);
            throw error;
        }
    }

    // --- Support sunucusunda admin mi? ---
    async function checkAdminStatus(userId) {
        if (!SUPPORT_GUILD_ID || !ADMIN_ROLE_ID) {
            console.warn('Admin kontrolü için SUPPORT_GUILD_ID ve ADMIN_ROLE_ID ayarlanmalıdır.');
            return false;
        }

        try {
            // Eğer client yoksa (dashboard için), basitçe false döndür
            if (!client) return false;
            
            const guild = client.guilds.cache.get(SUPPORT_GUILD_ID);
            if (!guild) {
                console.warn('Destek sunucusu bulunamadı:', SUPPORT_GUILD_ID);
                return false;
            }

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return false;
            }

            return member.roles.cache.has(ADMIN_ROLE_ID);
        } catch (error) {
            console.error('Admin kontrol hatası:', error);
            return false;
        }
    }

    return {
        exchangeCode,
        refreshAccessToken,
        getUserInfo,
        getUserGuilds,
        checkAdminStatus
    };
}

module.exports = {
    createDiscordService
};