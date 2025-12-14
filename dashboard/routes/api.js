// dashboard/routes/api.js

const express = require('express');
const os = require('os');
const { ObjectId } = require('mongodb');
const { requireApiAuth, requireAdmin } = require('../middleware/auth');

/**
 * API routes for dashboard
 * @param {import('express').Express} app
 * @param {import('discord.js').Client} client
 * @param {object} db - custom db wrapper (db.db, db.healthCheck, db.isConnected, ...)
 * @param {object} helpers - helper functions from app.js
 * @param {object} env - environment config
 */
module.exports = function registerApiRoutes(app, client, db, helpers = {}, env = {}) {
    const {
        getMemoryUsage,
        getUserGuilds,
        // refreshAccessToken app.js içinde middleware olarak kullanılıyor, burada çağırmamıza gerek yok
    } = helpers;

    // ─────────────────────────────
    //  İçerik (FAQ / Features / Commands)
    // ─────────────────────────────

    function resolveContentCollection(type) {
        switch (type) {
            case 'faq':
                return 'dashboard_content_faq';
            case 'features':
                return 'dashboard_content_features';
            case 'commands':
                return 'dashboard_content_commands';
            default:
                return null;
        }
    }

    // Tüm içerikleri getir
    app.get('/api/content/:type', requireApiAuth, requireAdmin, async (req, res) => {
        try {
            const { type } = req.params;
            const collectionName = resolveContentCollection(type);
            if (!collectionName) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            const contentDocs = await db.db
                .collection(collectionName)
                .find({})
                .sort({ order: 1 })
                .toArray();

            res.json({ success: true, data: contentDocs });
        } catch (error) {
            console.error('Content fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch content' });
        }
    });

    // Yeni içerik oluştur
    app.post('/api/content/:type', requireApiAuth, requireAdmin, async (req, res) => {
        try {
            const { type } = req.params;
            const data = req.body;
            const collectionName = resolveContentCollection(type);

            if (!collectionName) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            const doc = {
                ...data,
                createdAt: new Date()
            };

            const result = await db.db.collection(collectionName).insertOne(doc);

            res.json({
                success: true,
                message: 'Content created successfully',
                id: result.insertedId
            });
        } catch (error) {
            console.error('Content creation error:', error);
            res.status(500).json({ error: 'Failed to create content' });
        }
    });

    // İçerik güncelle
    app.put('/api/content/:type/:id', requireApiAuth, requireAdmin, async (req, res) => {
        try {
            const { type, id } = req.params;
            const data = { ...req.body };
            const collectionName = resolveContentCollection(type);

            if (!collectionName) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            delete data._id;

            const result = await db.db.collection(collectionName).updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: {
                        ...data,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.modifiedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ success: true, message: 'Content updated successfully' });
        } catch (error) {
            console.error('Content update error:', error);
            res.status(500).json({ error: 'Failed to update content' });
        }
    });

    // İçerik sil
    app.delete('/api/content/:type/:id', requireApiAuth, requireAdmin, async (req, res) => {
        try {
            const { type, id } = req.params;
            const collectionName = resolveContentCollection(type);

            if (!collectionName) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            const result = await db.db
                .collection(collectionName)
                .deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Content not found' });
            }

            res.json({ success: true, message: 'Content deleted successfully' });
        } catch (error) {
            console.error('Content delete error:', error);
            res.status(500).json({ error: 'Failed to delete content' });
        }
    });

    // İçerik sırasını güncelle
    app.put('/api/content/:type/order', requireApiAuth, requireAdmin, async (req, res) => {
        try {
            const { type } = req.params;
            const { items } = req.body;
            const collectionName = resolveContentCollection(type);

            if (!collectionName) {
                return res.status(400).json({ error: 'Invalid content type' });
            }

            if (!Array.isArray(items)) {
                return res.status(400).json({ error: 'Invalid items array' });
            }

            const bulkOps = items.map((item, index) => ({
                updateOne: {
                    filter: { _id: new ObjectId(item._id) },
                    update: { $set: { order: index + 1 } }
                }
            }));

            if (bulkOps.length > 0) {
                await db.db.collection(collectionName).bulkWrite(bulkOps);
            }

            res.json({ success: true, message: 'Order updated successfully' });
        } catch (error) {
            console.error('Order update error:', error);
            res.status(500).json({ error: 'Failed to update order' });
        }
    });

    // ─────────────────────────────
    //  Guild Settings
    // ─────────────────────────────

    app.post('/api/guild/:id/settings', requireApiAuth, async (req, res) => {
        try {
            const guildId = req.params.id;
            const settings = req.body;

            // Kullanıcının bu sunucuda yetkisi var mı?
            const userGuilds = await getUserGuilds(req.session.accessToken);
            const userGuild = userGuilds.find((g) => g.id === guildId);

            if (!userGuild || !((userGuild.permissions & 0x20) === 0x20)) {
                return res.status(403).json({ error: 'No permission' });
            }

            if (!db.db) {
                return res.status(500).json({ error: 'Database not ready' });
            }

            await db.db.collection('dashboard_guild_settings').updateOne(
                { guildId },
                {
                    $set: {
                        settings,
                        updatedAt: new Date(),
                        guildName: userGuild.name
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            res.json({ success: true, message: 'Settings saved' });
        } catch (error) {
            console.error('Save settings error:', error);
            res.status(500).json({ error: 'Failed to save settings' });
        }
    });

    // ─────────────────────────────
    //  Kullanıcı & Guild bilgileri
    // ─────────────────────────────

    app.get('/api/user', requireApiAuth, async (req, res) => {
        try {
            res.json({
                user: req.session.user,
                isAdmin: req.session.isAdmin,
                tokenExpires: req.session.tokenExpires
            });
        } catch (error) {
            console.error('User API error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/user/guilds', requireApiAuth, async (req, res) => {
        try {
            const guilds = await getUserGuilds(req.session.accessToken);
            const botGuilds = client.guilds.cache;

            const enhancedGuilds = guilds.map((guild) => ({
                ...guild,
                botInGuild: botGuilds.has(guild.id),
                canManage: (guild.permissions & 0x20) === 0x20,
                iconUrl: guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=256`
                    : null
            }));

            res.json({ guilds: enhancedGuilds });
        } catch (error) {
            console.error('User guilds API error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // ─────────────────────────────
    //  Stats / Health
    // ─────────────────────────────

    app.get('/api/stats', async (req, res) => {
        try {
            const memory = getMemoryUsage();
            const stats = {
                bot: {
                    tag: client.user?.tag || 'Not logged in',
                    id: client.user?.id || null,
                    guilds: client.guilds.cache.size,
                    users: client.users.cache.size,
                    channels: client.channels.cache.size,
                    ping: client.ws.ping,
                    uptime: process.uptime(),
                    shard: client.shard?.ids?.[0] || 0,
                    shardCount: client.shard?.count || 1
                },
                system: {
                    memory,
                    platform: os.platform(),
                    release: os.release(),
                    cpus: os.cpus().length,
                    loadavg: os.loadavg(),
                    nodeVersion: process.version
                }
            };

            res.json(stats);
        } catch (error) {
            console.error('Stats API error:', error);
            res.status(500).json({
                error: 'Failed to fetch stats',
                message: error.message
            });
        }
    });

    app.get('/api/health', async (req, res) => {
        try {
            let dbStatus = { status: 'unknown' };
            try {
                // db.healthCheck senin utils/database wrapper'ında tanımlı
                dbStatus = await db.healthCheck();
            } catch {
                dbStatus = { status: 'disconnected' };
            }

            const memory = getMemoryUsage();

            res.json({
                status: 'healthy',
                bot: client.user ? 'connected' : 'disconnected',
                database: dbStatus.status,
                memory: memory.heapUsed < 500 ? 'healthy' : 'warning',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '3.2.0'
            });
        } catch (error) {
            console.error('Health API error:', error);
            res.status(500).json({
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });
};
