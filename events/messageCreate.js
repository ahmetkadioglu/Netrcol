// events/messageCreate.js - FINAL UPDATED VERSION
const { Events, ChannelType, EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const devLogger = require('../utils/devLogger');
const LevelConfig = require('../models/levelConfig'); // 🟢 YENİ: Model eklendi

// XP Cooldown (10 Saniye)
const xpCooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        // ====================================================
        // 🕵️ 1. ANONİM TICKET SİSTEMİ (DM -> KANAL)
        // ====================================================
        if (message.channel.type === ChannelType.DM) {
            devLogger.sendLog(message.client, 'dm', {
                user: message.author,
                content: message.content,
                image: message.attachments.first()?.url
            });

            try {
                const activeTicket = await db.findAnyActiveTicket(message.author.id);
                
                if (activeTicket && activeTicket.type === 'anonymous') {
                    const guild = await message.client.guilds.fetch(activeTicket.guildId).catch(() => null);
                    if (!guild) return;

                    const channel = await guild.channels.fetch(activeTicket.channelId).catch(() => null);
                    if (!channel) {
                        return message.reply("❌ Error: Support channel not found.");
                    }

                    const isUserHidden = (activeTicket.anonMode === 'user' || activeTicket.anonMode === 'full');
                    
                    const embed = new EmbedBuilder()
                        .setColor('#5865F2')
                        .setAuthor({ 
                            name: isUserHidden ? 'Anonymous User' : message.author.tag, 
                            iconURL: isUserHidden ? 'https://cdn.discordapp.com/embed/avatars/0.png' : message.author.displayAvatarURL() 
                        }) 
                        .setDescription(message.content || '(Attachment sent)')
                        .setTimestamp();
                    
                    if (message.attachments.size > 0) embed.setImage(message.attachments.first().url);
                    
                    await channel.send({ embeds: [embed] });
                    await message.react('✅');
                    return; 
                }
            } catch (e) { }
        }

        // ====================================================
        // 📤 2. STAFF REPLY (KANAL -> DM)
        // ====================================================
        if (message.guild && message.channel.type === ChannelType.GuildText) {
            const ticket = await db.getTicketByChannel(message.channel.id);

            if (ticket && ticket.type === 'anonymous') {
                if (message.content.startsWith('.')) return; // Staff chat

                try {
                    const user = await message.client.users.fetch(ticket.userId).catch(() => null);
                    if (!user) return;

                    const isStaffHidden = (ticket.anonMode === 'staff' || ticket.anonMode === 'full');
                    
                    const embed = new EmbedBuilder()
                        .setColor('#FEE75C')
                        .setAuthor({ 
                            name: isStaffHidden ? 'Support Staff' : message.author.tag, 
                            iconURL: isStaffHidden ? 'https://cdn.discordapp.com/embed/avatars/1.png' : message.author.displayAvatarURL() 
                        })
                        .setDescription(message.content || '(Attachment sent)')
                        .setFooter({ text: message.guild.name })
                        .setTimestamp();

                    if (message.attachments.size > 0) embed.setImage(message.attachments.first().url);
                    
                    await user.send({ embeds: [embed] });
                    await message.react('📨');
                } catch (e) {
                    message.channel.send('❌ Could not send DM (User blocked DMs?).');
                }
            }
        }

        // ====================================================
        // 🌍 3. SUNUCU İÇİ SİSTEMLER
        // ====================================================
        if (message.guild) {
            
            // --- AFK ---
            const isAfk = await db.getAfk(message.author.id, message.guild.id);
            if (isAfk) {
                await db.removeAfk(message.author.id, message.guild.id);
                message.reply(`👋 Welcome back ${message.author}! I removed your AFK status.`)
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }
            if (message.mentions.users.size > 0) {
                message.mentions.users.forEach(async (user) => {
                    if (user.id === message.author.id) return;
                    const afkData = await db.getAfk(user.id, message.guild.id);
                    if (afkData) {
                        const time = Math.floor((Date.now() - afkData.timestamp) / 1000);
                        message.reply(`💤 **${user.username}** is AFK: ${afkData.reason} (<t:${time}:R>)`)
                            .then(m => setTimeout(() => m.delete().catch(() => {}), 10000));
                    }
                });
            }

            // --- OYUNLAR ---
            const gameData = await db.getWordGame(message.guild.id);
            if (gameData && gameData.channelId === message.channel.id) {
                if (message.content.startsWith('.')) return;
                const word = message.content.trim().split(' ')[0];
                if (gameData.lastUser === message.author.id) { message.delete().catch(()=>{}); return; }
                if (word.charAt(0).toLowerCase() !== gameData.lastWord.slice(-1).toLowerCase()) { message.delete().catch(()=>{}); return; }
                await db.updateWordGame(message.guild.id, word, message.author.id);
                await message.react('✅');
                return;
            }
            const countData = await db.getCountingGame(message.guild.id);
            if (countData && countData.channelId === message.channel.id) {
                const num = parseInt(message.content);
                if (isNaN(num)) return;
                if (countData.lastUser === message.author.id || num !== countData.currentNumber + 1) {
                    message.react('❌'); 
                    await db.setCountingGame(message.guild.id, { ...countData, currentNumber: 0, lastUser: null });
                    return;
                }
                await db.setCountingGame(message.guild.id, { ...countData, currentNumber: num, lastUser: message.author.id });
                await message.react('✅');
                return;
            }

            // --- XP SYSTEM (UPDATED) ---
            const key = `${message.guild.id}-${message.author.id}`;
            const now = Date.now();
            
            // Cooldown kontrolü
            if (!xpCooldowns.has(key) || now - xpCooldowns.get(key) > 10000) {
                xpCooldowns.set(key, now);

                // 🟢 YENİ: Seviye Sistemi Açık mı Kontrolü
                // Veritabanına bak: Eğer 'isActive: false' ise XP verme ve çık.
                const config = await LevelConfig.findOne({ guildId: message.guild.id });
                if (config && config.isActive === false) return; 

                // Sistem açıksa XP ver
                const userData = await db.addXp(message.author.id, message.guild.id, Math.floor(Math.random() * 11) + 15);
                if (userData) {
                    const newLvl = Math.floor(Math.sqrt(userData.xp) / 10);
                    if (newLvl > (userData.level || 0)) {
                        await db.setLevel(message.author.id, message.guild.id, newLvl);
                        message.channel.send(`🎉 **${message.author}** leveled up to **Lvl ${newLvl}**!`)
                            .then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
                    }
                }
            }
        }
    },
};