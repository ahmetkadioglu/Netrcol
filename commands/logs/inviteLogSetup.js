const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags, Collection } = require('discord.js');
const dbModule = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite-log-setup')
        .setDescription('Sets the channel where invite logs will be sent.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the text channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // Eğer deploy edilmediyse channel null gelebilir, kontrol edelim.
        if (!channel) {
            return interaction.reply({ 
                content: '⚠️ **Command Error:** Please run `node deploy.js` to update commands.', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            // --- AKILLI VERİTABANI SEÇİCİ ---
            let database;
            if (dbModule.db) {
                database = dbModule.db;
            } else if (typeof dbModule.getDb === 'function') {
                database = dbModule.getDb();
            } else if (dbModule.client && typeof dbModule.client.db === 'function') {
                database = dbModule.client.db();
            }

            if (!database) {
                console.error('❌ DB Error: Database connection is missing in inviteLogSetup.');
                return interaction.reply({ 
                    content: '❌ **System Error:** Database connection not found. Please check bot logs.', 
                    flags: MessageFlags.Ephemeral 
                });
            }
            // --------------------------------

            // 1. Ayarı Veritabanına Kaydet
            await database.collection('guildSettings').updateOne(
                { guildId: interaction.guild.id },
                { 
                    $set: { 
                        inviteLogChannel: channel.id,
                        updatedAt: new Date()
                    } 
                },
                { upsert: true }
            );

            // 2. [ÖNEMLİ] Sunucunun Davetlerini Hemen Hafızaya Al (Cache Update)
            // Bunu yapmazsak, bot yeniden başlayana kadar bu sunucuda sistem çalışmaz.
            // Çünkü inviteTracker sadece "başlangıçta" veritabanında kaydı olanları çekiyor.
            try {
                // Client üzerinde invites koleksiyonu yoksa oluştur
                if (!interaction.client.invites) {
                    interaction.client.invites = new Collection();
                }

                const invites = await interaction.guild.invites.fetch();
                const codeUses = new Collection();
                invites.each(inv => codeUses.set(inv.code, inv.uses));
                
                interaction.client.invites.set(interaction.guild.id, codeUses);
                console.log(`➕ New Setup: Invites cached for ${interaction.guild.name}`);
            } catch (err) {
                console.warn(`⚠️ Could not cache invites for ${interaction.guild.name} (Missing Permissions?)`);
            }

            // 3. Başarılı Mesajı
            await interaction.reply({ 
                content: `✅ **Setup Complete!** Invite logs will be sent to ${channel}.`, 
                flags: MessageFlags.Ephemeral 
            });

        } catch (error) {
            console.error('Setup Command Error:', error);
            await interaction.reply({ 
                content: '❌ An error occurred while saving settings.', 
                flags: MessageFlags.Ephemeral 
            });
        }
    }
};