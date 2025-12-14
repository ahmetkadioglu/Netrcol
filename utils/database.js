// utils/database.js - FINAL (ALL SYSTEMS + DEVELOPER CONTROLS)
const { MongoClient } = require('mongodb');
const config = require('../config/config');

class Database {
    constructor() {
        this.client = new MongoClient(config.mongoUri);
        this.db = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(config.database.name);
            this.isConnected = true;
            console.log('✅ Connected to MongoDB');
            await this.createIndexes();
        } catch (error) {
            console.error('❌ MongoDB Connection Error:', error);
            process.exit(1);
        }
    }

    async createIndexes() {
        try {
            if (!this.db) return;
            // Mevcut İndeksler
            await this.db.collection('active_tickets').createIndex({ userId: 1, guildId: 1 });
            await this.db.collection('active_tickets').createIndex({ channelId: 1 });
            await this.db.collection('ticket_settings').createIndex({ guildId: 1 }, { unique: true });
            await this.db.collection('warnings').createIndex({ guildId: 1, userId: 1 });
            await this.db.collection('active_jails').createIndex({ guildId: 1, userId: 1 });
            await this.db.collection('giveaways').createIndex({ messageId: 1 }, { unique: true });
            await this.db.collection('active_jtc_channels').createIndex({ channelId: 1 }, { unique: true });
            await this.db.collection('economy').createIndex({ userId: 1, guildId: 1 }, { unique: true });
            await this.db.collection('levels').createIndex({ userId: 1, guildId: 1 }, { unique: true });
            await this.db.collection('afk_users').createIndex({ userId: 1, guildId: 1 }, { unique: true });
            
            // [YENİ] Developer İndeksleri
            await this.db.collection('blacklist').createIndex({ userId: 1 }, { unique: true });
            await this.db.collection('premium_guilds').createIndex({ guildId: 1 }, { unique: true });

        } catch (error) {
            console.error('Index creation error:', error);
        }
    }

    async healthCheck() {
        if (!this.isConnected) return { status: 'disconnected' };
        try {
            await this.db.command({ ping: 1 });
            return { status: 'connected', database: config.database.name };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    // ==========================================
    // ⛔ BLACKLIST SYSTEM (YENİ)
    // ==========================================
    async addBlacklist(userId, reason, moderatorId) {
        if (!this.db) return;
        await this.db.collection('blacklist').updateOne(
            { userId: userId },
            { $set: { reason, moderatorId, timestamp: new Date() } },
            { upsert: true }
        );
    }

    async removeBlacklist(userId) {
        if (!this.db) return;
        await this.db.collection('blacklist').deleteOne({ userId: userId });
    }

    async isBlacklisted(userId) {
        if (!this.db) return null;
        return await this.db.collection('blacklist').findOne({ userId: userId });
    }

    // ==========================================
    // 💎 PREMIUM SYSTEM (YENİ)
    // ==========================================
    async addPremium(guildId, days, moderatorId) {
        if (!this.db) return;
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + days);

        await this.db.collection('premium_guilds').updateOne(
            { guildId: guildId },
            { $set: { expiresAt: expireDate, moderatorId, createdAt: new Date() } },
            { upsert: true }
        );
        return expireDate;
    }

    async isPremium(guildId) {
        if (!this.db) return false;
        const data = await this.db.collection('premium_guilds').findOne({ guildId: guildId.toString() });
        if (!data) return false;
        return data.expiresAt > new Date(); // Süresi dolmamışsa true
    }

    // ==========================================
    // (MEVCUT SİSTEMLER - AYNI KALIYOR)
    // ==========================================
    
    // AFK
    async setAfk(userId, guildId, reason) { if(!this.db) return; await this.db.collection('afk_users').updateOne({ userId, guildId: guildId.toString() }, { $set: { reason, timestamp: Date.now() } }, { upsert: true }); }
    async getAfk(userId, guildId) { if(!this.db) return null; return await this.db.collection('afk_users').findOne({ userId, guildId: guildId.toString() }); }
    async removeAfk(userId, guildId) { if(!this.db) return; await this.db.collection('afk_users').deleteOne({ userId, guildId: guildId.toString() }); }

    // Levels
    async getUserRank(userId, guildId) { if(!this.db) return null; return await this.db.collection('levels').findOne({ userId, guildId: guildId.toString() }); }
    async addXp(userId, guildId, xpToAdd) { if(!this.db) return null; return await this.db.collection('levels').findOneAndUpdate({ userId, guildId: guildId.toString() }, { $inc: { xp: xpToAdd }, $setOnInsert: { level: 0 } }, { upsert: true, returnDocument: 'after' }); }
    async setLevel(userId, guildId, newLevel) { if(!this.db) return; await this.db.collection('levels').updateOne({ userId, guildId: guildId.toString() }, { $set: { level: newLevel } }); }
    async getLeaderboard(guildId, limit=10) { if(!this.db) return []; return await this.db.collection('levels').find({ guildId: guildId.toString() }).sort({ xp: -1 }).limit(limit).toArray(); }

    // Games
    async getWordGame(g) { if(!this.db) return null; return await this.db.collection('word_game').findOne({ guildId: g.toString() }); }
    async setWordGame(g, d) { if(!this.db) return; await this.db.collection('word_game').updateOne({ guildId: g.toString() }, { $set: d }, { upsert: true }); }
    async updateWordGame(g, w, u) { if(!this.db) return; await this.db.collection('word_game').updateOne({ guildId: g.toString() }, { $set: { lastWord: w, lastUser: u, updatedAt: new Date() }, $inc: { count: 1 } }); }
    async getCountingGame(g) { if(!this.db) return null; return await this.db.collection('counting_game').findOne({ guildId: g.toString() }); }
    async setCountingGame(g, d) { if(!this.db) return; await this.db.collection('counting_game').updateOne({ guildId: g.toString() }, { $set: d }, { upsert: true }); }

    // Economy
    async getUserBalance(u, g) { if(!this.db) return 0; const r = await this.db.collection('economy').findOne({ userId: u, guildId: g.toString() }); return r ? r.balance : 0; }
    async addMoney(u, g, a) { if(!this.db) return; await this.db.collection('economy').updateOne({ userId: u, guildId: g.toString() }, { $inc: { balance: a }, $setOnInsert: { lastDaily: null } }, { upsert: true }); }
    async removeMoney(u, g, a) { if(!this.db) return; await this.db.collection('economy').updateOne({ userId: u, guildId: g.toString() }, { $inc: { balance: -a } }); }
    async claimDaily(u, g, a) { if(!this.db) return {success:false}; const now=Date.now(); const user=await this.db.collection('economy').findOne({userId:u, guildId:g.toString()}); if(user && user.lastDaily && (now-user.lastDaily)<86400000) return {success:false, timeLeft: 86400000-(now-user.lastDaily)}; await this.db.collection('economy').updateOne({userId:u, guildId:g.toString()}, {$inc:{balance:a}, $set:{lastDaily:now}}, {upsert:true}); return {success:true}; }

    // JTC
    async addActiveJTC(d) { if(!this.db) return; await this.db.collection('active_jtc_channels').insertOne(d); }
    async getActiveJTC(c) { if(!this.db) return null; return await this.db.collection('active_jtc_channels').findOne({ channelId: c }); }
    async getJTCByOwner(u) { if(!this.db) return null; return await this.db.collection('active_jtc_channels').findOne({ ownerId: u }); }
    async removeActiveJTC(c) { if(!this.db) return; await this.db.collection('active_jtc_channels').deleteOne({ channelId: c }); }
    async getJTCSettings(g) { if(!this.db) return null; const s=await this.getGuildSettings(g); return s.jtc||null; }
    async saveJTCSettings(g, d) { if(!this.db) return; const c=await this.getGuildSettings(g); await this.saveGuildSettings(g, {...c, jtc:d}); }

    // Suggestion
    async getSuggestionSettings(g) { if(!this.db) return null; return await this.db.collection('suggestion_settings').findOne({ guildId: g.toString() }); }
    async setSuggestionSettings(g, c) { if(!this.db) return; await this.db.collection('suggestion_settings').updateOne({ guildId: g.toString() }, { $set: { channelId: c } }, { upsert: true }); }

    // Giveaway
    async saveGiveaway(d) { if(!this.db) return; await this.db.collection('giveaways').insertOne(d); }
    async getActiveGiveaways() { if(!this.db) return []; return await this.db.collection('giveaways').find({ ended: false }).toArray(); }
    async endGiveaway(m) { if(!this.db) return; await this.db.collection('giveaways').updateOne({ messageId: m }, { $set: { ended: true, endedAt: new Date() } }); }
    async getGiveaway(m) { if(!this.db) return null; return await this.db.collection('giveaways').findOne({ messageId: m }); }
    async deleteGiveaway(m) { if(!this.db) return; await this.db.collection('giveaways').deleteOne({ messageId: m }); }

    // Ticket
    async getTicketSettings(g) { if(!this.db) return {enabled:false}; return await this.db.collection('ticket_settings').findOne({guildId: g.toString()}) || {enabled:false}; }
    async saveTicketSettings(g, s) { if(!this.db) return; await this.db.collection('ticket_settings').updateOne({guildId: g.toString()}, {$set: s}, {upsert:true}); }
    async createTicket(d) { if(!this.db) return; await this.db.collection('active_tickets').insertOne(d); }
    async findActiveTicket(u, g) { if(!this.db) return null; return await this.db.collection('active_tickets').findOne({userId:u, guildId:g.toString()}); }
    async getTicketByChannel(c) { if(!this.db) return null; return await this.db.collection('active_tickets').findOne({channelId: c}); }
    async findAnyActiveTicket(u) { if(!this.db) return null; return await this.db.collection('active_tickets').findOne({userId:u}, {sort:{createdAt:-1}}); }
    async deleteTicket(c) { if(!this.db) return; await this.db.collection('active_tickets').deleteOne({channelId: c}); }
    async deleteTicketChannel(g, c) { return this.deleteTicket(c); }
    async getTicketStats() { if(!this.db) return null; const t=await this.db.collection('active_tickets').countDocuments(); return {totalTickets:t, openTickets:t, todayTickets:0, closedTickets:0}; }

    // General
    async addWarning(g, u, m, r) { if(!this.db) return; await this.db.collection('warnings').insertOne({guildId:g.toString(), userId:u, moderatorId:m, reason:r, timestamp:new Date()}); }
    async getWarnings(g, u) { if(!this.db) return []; return await this.db.collection('warnings').find({guildId:g.toString(), userId:u}).toArray(); }
    async setJail(g, u, r) { if(!this.db) return; await this.db.collection('active_jails').updateOne({guildId:g.toString(), userId:u}, {$set:{roles:r, jailedAt:new Date()}}, {upsert:true}); }
    async getJail(g, u) { if(!this.db) return null; return await this.db.collection('active_jails').findOne({guildId:g.toString(), userId:u}); }
    async removeJail(g, u) { if(!this.db) return; await this.db.collection('active_jails').deleteOne({guildId:g.toString(), userId:u}); }
    async getGuildSettings(g) { if(!this.db) return {}; return await this.db.collection('guild_settings').findOne({guildId:g.toString()}) || {}; }
    async saveGuildSettings(g, s) { if(!this.db) return; await this.db.collection('guild_settings').updateOne({guildId:g.toString()}, {$set:s}, {upsert:true}); }
    async getRegistrationSettings(g) { if(!this.db) return null; return await this.db.collection('registration_settings').findOne({guildId:g.toString()}); }
    async getWelcomeSettings(g) { if(!this.db) return null; return await this.db.collection('guild_settings').findOne({guildId:g.toString()}).then(d=>d?.welcome||null); }
    async saveWelcomeSettings(g, d) { if(!this.db) return; const c=await this.getGuildSettings(g); await this.saveGuildSettings(g, {...c, welcome:d}); }
}

module.exports = new Database();