// commands/tickets/ticket-disable.js - FULL RESET (SETTINGS + TOPICS)
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-disable')
        .setDescription('Disable ticket system, reset settings AND clear all topics'),
    async execute(interaction) {
        const { guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '❌ Administrator permissions required!', 
                flags: 64
            });
        }

        // Kullanıcıya bilgi ver (İşlem uzun sürebilir)
        await interaction.deferReply();

        try {
            const currentSettings = await db.getTicketSettings(guild.id);
            
            // 1. Creation channel'daki mesajı temizle
            if (currentSettings?.creationChannelId) {
                try {
                    const creationChannel = guild.channels.cache.get(currentSettings.creationChannelId);
                    if (creationChannel) {
                        const messages = await creationChannel.messages.fetch({ limit: 10 });
                        const ticketMessages = messages.filter(msg => 
                            msg.author.id === guild.client.user.id && 
                            msg.embeds.length > 0 &&
                            msg.embeds[0].title?.includes('Ticket')
                        );
                        if (ticketMessages.size > 0) await creationChannel.bulkDelete(ticketMessages);
                    }
                } catch (error) {
                    console.log('Could not clear ticket messages:', error.message);
                }
            }

            // 2. TÜM KONULARI SİL (YENİ EKLENEN KISIM)
            // Veritabanına doğrudan erişip o sunucuya ait tüm kategorileri siliyoruz
            if (db.db) {
                await db.db.collection('ticket_categories').deleteMany({ 
                    guildId: guild.id.toString() 
                });
            }

            // 3. AYARLARI SIFIRLA
            await db.saveTicketSettings(guild.id, {
                enabled: false,
                creationChannelId: null,
                // Custom Texts Reset
                panelTitle: null, panelDescription: null,
                panelBtnCreate: null, panelBtnRules: null,
                ticketDescription: null,
                ticketBtnClaim: null, ticketBtnClose: null, ticketBtnSettings: null,
                // Rules Reset
                rulesTitle: null, rulesDescription: null,
                // Colors Reset
                styleCreate: null, styleRules: null,
                styleClaim: null, styleClose: null, styleSettings: null
            });

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🚫 Ticket System Disabled')
                .setDescription('The system has been completely reset:')
                .addFields(
                    { name: '🗑️ Topics', value: 'All ticket topics have been deleted.', inline: true },
                    { name: '⚙️ Settings', value: 'All custom messages & colors reset to default.', inline: true },
                    { name: '🔌 Status', value: 'System is now offline.', inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Disable error:', error);
            await interaction.editReply({ 
                content: `❌ Failed to disable system: ${error.message}`
            });
        }
    },
};