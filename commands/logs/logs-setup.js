// commands/logs/logs-setup.js
const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs-setup')
        .setDescription('Configure the advanced logging system')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where logs will be sent')
                .addChannelTypes(0) // 0 = GuildText
                .setRequired(true)) // Kanal seçimi zorunlu
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        // 1. Kanalı Önce Kaydet (Garantile)
        const currentSettings = await db.getGuildSettings(interaction.guild.id);
        const newLogs = {
            ...(currentSettings.logs || {}),
            channelId: channel.id
        };
        await db.saveGuildSettings(interaction.guild.id, { logs: newLogs });

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎛️ Advanced Log Configuration')
            .setDescription(`**Target Channel:** ${channel}\n\nSelect a category below to configure which events to log.`)
            .addFields(
                { name: '1️⃣ Configure Categories', value: 'Select a category to toggle specific events.', inline: false },
                { name: '2️⃣ Quick Actions', value: 'Use buttons to Enable/Disable ALL logs.', inline: false }
            );

        // Kategori Seçimi
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('logset_category_select')
            .setPlaceholder('Select a Category to Configure...')
            .addOptions([
                { label: '🛡️ Moderation & Safety', value: 'cat_mod', description: 'Ban, Kick, Timeout, Mod Commands...' },
                { label: '📂 Channels & Server', value: 'cat_server', description: 'Channel Create/Delete, Server Update, Roles...' },
                { label: '👥 Members', value: 'cat_member', description: 'Join, Leave, Nickname, Role Updates...' },
                { label: '💬 Messages', value: 'cat_msg', description: 'Message Delete, Update...' },
                { label: '🔊 Voice', value: 'cat_voice', description: 'Join, Leave, Move, Mute/Deafen...' }
            ]);

        // Hızlı İşlem Butonları
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('logset_enable_all').setLabel('Enable ALL Logs').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId('logset_disable_all').setLabel('Disable ALL Logs').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
            new ButtonBuilder().setCustomId('logset_status').setLabel('Check Status').setStyle(ButtonStyle.Secondary).setEmoji('📊')
        );

        await interaction.reply({ 
            embeds: [embed], 
            components: [
                new ActionRowBuilder().addComponents(categorySelect),
                buttons
            ] 
        });
    },
};