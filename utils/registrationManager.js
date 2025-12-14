// utils/registrationManager.js - ADDED CHAT CHANNEL & TAG DATA
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const db = require('./database');

class RegistrationManager {
    constructor() {
        this.setupSessions = new Map();
    }

    startSetup(userId, guildId, type) {
        const sessionKey = `${guildId}-${userId}`;
        
        const session = {
            userId,
            guildId,
            type, 
            step: 0,
            data: {
                registrationChannelId: null,
                unregisteredRoleId: null,
                registeredRoleId: null, // Bu zaten vardı
                logChannelId: null,
                chatChannelId: null, // YENİ: Sohbet Kanalı
                autoName: false,
                autoRole: false
            }
        };

        this.setupSessions.set(sessionKey, session);
        return session;
    }

    getSession(userId, guildId) {
        return this.setupSessions.get(`${guildId}-${userId}`);
    }

    updateSession(userId, guildId, data) {
        const session = this.getSession(userId, guildId);
        if (session) {
            session.data = { ...session.data, ...data };
            session.step++;
            this.setupSessions.set(`${guildId}-${userId}`, session);
        }
        return session;
    }

    async endSetup(userId, guildId) {
        const session = this.getSession(userId, guildId);
        if (session) {
            const updateData = {};
            updateData[session.type] = session.data;
            await db.saveRegistrationSettings(guildId, updateData);
            this.setupSessions.delete(`${guildId}-${userId}`);
            return session.data;
        }
        return null;
    }
}

module.exports = new RegistrationManager();