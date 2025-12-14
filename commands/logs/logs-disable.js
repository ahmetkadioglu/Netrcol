const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs-disable')
        .setDescription('Disable the logging system for the server'),
    async execute(interaction) {
        const { guild, member } = interaction;

        if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '❌ You do not have permission to use this command!', 
                flags: 64 
            });
        }

        try {
            const settings = await db.getGuildSettings(guild.id);
            
            if (!settings.logChannelId) {
                return interaction.reply({ 
                    content: '❌ Log system is not enabled!', 
                    flags: 64 
                });
            }

            await db.saveGuildSettings(guild.id, {
                ...settings,
                logChannelId: null,
                logEvents: []
            });

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Log System Disabled')
                .setDescription('The logging system has been successfully disabled.')
                .addFields(
                    { name: 'Previous Log Channel', value: `<#${settings.logChannelId}>`, inline: true },
                    { name: 'Disabled Log Types', value: `${settings.logEvents?.length || 0}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: `❌ Failed to disable log system: ${error.message}`, 
                flags: 64 
            });
        }
    },
};