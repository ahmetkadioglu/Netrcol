// commands/logs/logs-edit.js - TICKET EVENTS EKLENDİ
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../utils/database');

const logTypes = [
    { label: 'Message Delete', value: 'message_delete', description: 'Log when messages are deleted' },
    { label: 'Message Edit', value: 'message_edit', description: 'Log when messages are edited' },
    { label: 'Member Join', value: 'member_join', description: 'Log when members join the server' },
    { label: 'Member Leave', value: 'member_leave', description: 'Log when members leave the server' },
    { label: 'Member Ban', value: 'member_ban', description: 'Log when members are banned' },
    { label: 'Member Unban', value: 'member_unban', description: 'Log when members are unbanned' },
    { label: 'Member Kick', value: 'member_kick', description: 'Log when members are kicked' },
    { label: 'Member Timeout', value: 'member_timeout', description: 'Log when members are timed out' },
    { label: 'Timeout Remove', value: 'timeout_remove', description: 'Log when timeouts are removed' },
    { label: 'Channel Create', value: 'channel_create', description: 'Log when channels are created' },
    { label: 'Channel Delete', value: 'channel_delete', description: 'Log when channels are deleted' },
    { label: 'Channel Update', value: 'channel_update', description: 'Log when channels are updated' },
    { label: 'Role Create', value: 'role_create', description: 'Log when roles are created' },
    { label: 'Role Delete', value: 'role_delete', description: 'Log when roles are deleted' },
    { label: 'Role Update', value: 'role_update', description: 'Log when roles are updated' },
    { label: 'Voice Join', value: 'voice_join', description: 'Log when members join voice channels' },
    { label: 'Voice Leave', value: 'voice_leave', description: 'Log when members leave voice channels' },
    { label: 'Voice Move', value: 'voice_move', description: 'Log when members move between voice channels' },
    { label: 'Ticket Events', value: 'ticket_events', description: 'Log all ticket events (create, close, claim, etc.)' } // ✅ YENİ EKLENDİ
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logs-edit')
        .setDescription('Edit the logging system settings'),
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
                    content: '❌ Log system is not setup yet. Use `/logs-setup` first.', 
                    flags: 64 
                });
            }

            const currentLogs = settings.logEvents || [];
            const logChannel = guild.channels.cache.get(settings.logChannelId);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('⚙️ Edit Log System')
                .setDescription('Select the log types you want to enable. Currently enabled logs are pre-selected.')
                .addFields(
                    { name: 'Current Log Channel', value: logChannel ? logChannel.toString() : 'Not found', inline: true },
                    { name: 'Currently Enabled', value: `${currentLogs.length} log types`, inline: true },
                    { name: 'Instructions', value: 'Select/deselect log types from the dropdown below. Your current selection will be saved.', inline: false }
                )
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('log_edit_select')
                .setPlaceholder('Select log types...')
                .setMinValues(0)
                .setMaxValues(logTypes.length)
                .addOptions(logTypes.map(log => ({
                    ...log,
                    default: currentLogs.includes(log.value)
                })));

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({ 
                embeds: [embed], 
                components: [actionRow],
                flags: 64 
            });

            const filter = (i) => i.customId === 'log_edit_select' && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                const selectedLogs = i.values;
                
                await db.saveGuildSettings(guild.id, {
                    ...settings,
                    logEvents: selectedLogs
                });

                const successEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('✅ Log System Updated!')
                    .setDescription(`Logging has been updated to track ${selectedLogs.length} event types.`)
                    .addFields(
                        { name: 'Log Channel', value: logChannel ? logChannel.toString() : 'Not found', inline: true },
                        { name: 'Total Log Types', value: `${selectedLogs.length}`, inline: true },
                        { name: 'Enabled Logs', value: selectedLogs.length > 0 
                            ? selectedLogs.map(log => `• ${logTypes.find(l => l.value === log)?.label}`).join('\n')
                            : 'No logs enabled'
                        , inline: false }
                    )
                    .setTimestamp();

                await i.update({ embeds: [successEmbed], components: [] });
                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.editReply({ 
                        content: '❌ Log edit timed out. Please run the command again.', 
                        components: [] 
                    });
                }
            });

        } catch (error) {
            await interaction.reply({ 
                content: `❌ Failed to edit log system: ${error.message}`, 
                flags: 64 
            });
        }
    },
};