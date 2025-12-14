// utils/jtcManager.js
const { 
    ChannelType, 
    PermissionsBitField, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder,
    UserSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const db = require('./database');
const helpers = require('./helpers'); // Loglama için (Eğer helpers.js yoksa devLogger kullanabiliriz, senin yapına göre uyarla)
// Eğer helpers.js kullanmıyorsan, aşağıdaki logAction fonksiyonunu devLogger ile değiştirebilirsin.
// Biz senin mevcut yapındaki logAction'ı koruyarak devam edelim.

class JTCManager {
    
    // --- AKILLI LOGLAMA ---
    async logAction(interaction, action, details) {
        try {
            // Log sistemin helpers veya devLogger üzerinden çalışıyor olabilir.
            // Önceki kodlarına sadık kalarak burayı basit tutuyorum.
            // Eğer devLogger kullanıyorsan import edip onu çağırabilirsin.
            const devLogger = require('./devLogger');
            await devLogger.sendLog(interaction.client, 'rateLimit', { // Geçici olarak rateLimit tipini kullanıyorum veya custom bir tip
                 user: interaction.user,
                 command: `JTC: ${action}`,
                 time: 0
            });
            console.log(`✅ Log sent: ${action}`);
        } catch (e) {
            // Log hatası botu durdurmasın
        }
    }

    // --- ODA OLUŞTURMA ---
    async createPrivateRoom(member) {
        try {
            const guildId = member.guild.id;
            const settings = await db.getJTCSettings(guildId);

            if (!settings || !settings.enabled) return;
            if (member.voice.channelId !== settings.triggerChannelId) return;

            const existingRoom = await db.getJTCByOwner(member.id);
            if (existingRoom) {
                const channel = member.guild.channels.cache.get(existingRoom.channelId);
                if (channel) {
                    await member.voice.setChannel(channel).catch(() => {});
                    return;
                } else {
                    await db.removeActiveJTC(existingRoom.channelId);
                }
            }

            const channelName = `🔊 ${member.user.username}'s Room`;

            const channel = await member.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                parent: settings.categoryId,
                permissionOverwrites: [
                    {
                        id: member.guild.id, // @everyone
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: member.id, // Sahip
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers]
                    },
                    {
                        id: member.client.user.id, // Bot
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            await member.voice.setChannel(channel);

            await db.addActiveJTC({
                guildId: guildId,
                channelId: channel.id,
                ownerId: member.id,
                createdAt: new Date()
            });

            await this.sendControlPanel(channel);

        } catch (error) {
            console.error('JTC Create Error:', error);
        }
    }

    // --- KONTROL PANELİ ---
    async sendControlPanel(channel) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎛️ Voice Control Panel')
            .setDescription('Manage your private room settings below.')
            .addFields(
                { name: '🔒 Security', value: 'Lock/Unlock room', inline: true },
                { name: '👁️ Privacy', value: 'Hide/Show room', inline: true },
                { name: '🛠️ Moderation', value: 'Kick, Ban or Rename', inline: true }
            );

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('jtc_lock').setLabel('Lock').setStyle(ButtonStyle.Secondary).setEmoji('🔒'),
            new ButtonBuilder().setCustomId('jtc_unlock').setLabel('Unlock').setStyle(ButtonStyle.Secondary).setEmoji('🔓'),
            new ButtonBuilder().setCustomId('jtc_hide').setLabel('Hide').setStyle(ButtonStyle.Secondary).setEmoji('🙈'),
            new ButtonBuilder().setCustomId('jtc_show').setLabel('Show').setStyle(ButtonStyle.Secondary).setEmoji('👀')
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('jtc_rename').setLabel('Rename').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
            new ButtonBuilder().setCustomId('jtc_kick').setLabel('Kick').setStyle(ButtonStyle.Danger).setEmoji('👢'), // Sadece odadakiler
            new ButtonBuilder().setCustomId('jtc_ban').setLabel('Ban').setStyle(ButtonStyle.Danger).setEmoji('🚫')   // Tüm sunucu
        );

        await channel.send({ embeds: [embed], components: [row1, row2] });
    }

    // --- ETKİLEŞİM YÖNETİMİ ---
    async handleInteraction(interaction) {
        const roomData = await db.getActiveJTC(interaction.channel.id);
        
        if (!roomData) return interaction.reply({ content: '❌ This is not a managed voice room.', ephemeral: true });
        if (interaction.user.id !== roomData.ownerId) return interaction.reply({ content: '❌ Only the room owner can use these controls.', ephemeral: true });

        const channel = interaction.channel;
        const everyone = interaction.guild.roles.everyone;

        try {
            switch (interaction.customId) {
                // ... (LOCK, UNLOCK, HIDE, SHOW Kodları aynı kalıyor, yer kazanmak için kısalttım) ...
                case 'jtc_lock':
                    await channel.permissionOverwrites.edit(everyone, { Connect: false });
                    await interaction.reply({ content: '🔒 Room **LOCKED**.', ephemeral: true });
                    break;
                case 'jtc_unlock':
                    await channel.permissionOverwrites.edit(everyone, { Connect: null });
                    await interaction.reply({ content: '🔓 Room **UNLOCKED**.', ephemeral: true });
                    break;
                case 'jtc_hide':
                    await channel.permissionOverwrites.edit(everyone, { ViewChannel: false });
                    await interaction.reply({ content: '🙈 Room **HIDDEN**.', ephemeral: true });
                    break;
                case 'jtc_show':
                    await channel.permissionOverwrites.edit(everyone, { ViewChannel: null });
                    await interaction.reply({ content: '👀 Room **VISIBLE**.', ephemeral: true });
                    break;
                case 'jtc_rename':
                    const modal = new ModalBuilder().setCustomId('jtc_rename_modal').setTitle('Rename Room')
                        .addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('new_name').setLabel("Name").setStyle(TextInputStyle.Short)));
                    await interaction.showModal(modal);
                    break;

                // --- KICK (YENİLENMİŞ - SADECE ODADAKİLER) ---
                case 'jtc_kick': {
                    // Odadaki üyeleri al (Bot ve Sahip hariç)
                    const members = channel.members.filter(m => !m.user.bot && m.id !== interaction.user.id);
                    
                    if (members.size === 0) {
                        return interaction.reply({ content: '❌ There is no one else in the room to kick.', ephemeral: true });
                    }

                    // En fazla 25 kişi listelenebilir (Discord sınırı)
                    const options = members.first(25).map(member => ({
                        label: member.displayName,
                        value: member.id,
                        description: member.user.tag,
                        emoji: '👤'
                    }));

                    const menu = new StringSelectMenuBuilder()
                        .setCustomId('jtc_kick_select') // String Select Menu kullanıyoruz
                        .setPlaceholder('Select a user to kick from this room')
                        .addOptions(options);

                    const row = new ActionRowBuilder().addComponents(menu);
                    await interaction.reply({ content: '👢 **Kick User:** Select who to remove from the channel.', components: [row], ephemeral: true });
                    break;
                }

                // --- BAN (YENİ - TÜM SUNUCU) ---
                case 'jtc_ban': {
                    const userSelect = new UserSelectMenuBuilder()
                        .setCustomId('jtc_ban_select') // User Select Menu kullanıyoruz
                        .setPlaceholder('Select a user to BAN from this room')
                        .setMaxValues(1);

                    const row = new ActionRowBuilder().addComponents(userSelect);
                    await interaction.reply({ content: '🚫 **Ban User:** Select a user to prevent them from joining.', components: [row], ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error('JTC Action Error:', error);
            if (!interaction.replied) await interaction.reply({ content: '❌ Failed to perform action.', ephemeral: true });
        }
    }

    // --- INPUT HANDLER (Kick, Ban, Rename) ---
    async handleInput(interaction) {
        if (!interaction.customId.startsWith('jtc_')) return;

        const roomData = await db.getActiveJTC(interaction.channel.id);
        if (!roomData || interaction.user.id !== roomData.ownerId) return;

        try {
            // RENAME
            if (interaction.customId === 'jtc_rename_modal') {
                const newName = interaction.fields.getTextInputValue('new_name');
                await interaction.channel.setName(newName);
                await interaction.reply({ content: `✅ Room renamed to **${newName}**`, ephemeral: true });
            } 
            
            // KICK (String Select Menu)
            else if (interaction.customId === 'jtc_kick_select') {
                const userId = interaction.values[0]; // String menu value'su
                const member = await interaction.guild.members.fetch(userId).catch(() => null);
                
                if (member && member.voice.channelId === interaction.channel.id) {
                    await member.voice.disconnect('Kicked by room owner');
                    await interaction.reply({ content: `👢 **${member.user.tag}** has been kicked from the room.`, ephemeral: true });
                    // Log
                    this.logAction(interaction, 'Kick', `User: ${member.user.tag}`);
                } else {
                    await interaction.reply({ content: '❌ User is no longer in the room.', ephemeral: true });
                }
            }

            // BAN (User Select Menu)
            else if (interaction.customId === 'jtc_ban_select') {
                const userId = interaction.values[0];
                const member = await interaction.guild.members.fetch(userId).catch(() => null);

                // İzinlere 'Connect: false' ekleyerek banlıyoruz
                await interaction.channel.permissionOverwrites.edit(userId, {
                    Connect: false
                });

                // Eğer kullanıcı o an odadaysa, atıyoruz (Kick)
                let extraMsg = '';
                if (member && member.voice.channelId === interaction.channel.id) {
                    await member.voice.disconnect('Banned by room owner');
                    extraMsg = ' and removed from the channel';
                }

                const targetName = member ? member.user.tag : userId;
                await interaction.reply({ content: `🚫 **${targetName}** has been **BANNED**${extraMsg}. They cannot join this room anymore.`, ephemeral: true });
                
                // Log
                this.logAction(interaction, 'Ban', `User: ${targetName}`);
            }

        } catch (error) {
            console.error('JTC Input Error:', error);
            if (!interaction.replied) await interaction.reply({ content: '❌ Action failed.', ephemeral: true });
        }
    }

    // --- ODA SİLME KONTROLÜ ---
    async checkChannelDelete(member, channelId) {
        try {
            const jtcRoom = await db.getActiveJTC(channelId);
            if (!jtcRoom) return;

            const channel = member.guild.channels.cache.get(channelId);
            if (!channel || channel.members.size === 0) {
                if (channel) await channel.delete().catch(() => {});
                await db.removeActiveJTC(channelId);
            }
        } catch (error) {
            console.error('JTC Delete Check Error:', error);
        }
    }
}

module.exports = new JTCManager();