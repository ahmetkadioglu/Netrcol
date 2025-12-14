// events/logSettingsInteraction.js
const { Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../utils/database');

const LOG_TYPES = {
    cat_mod: [
        { label: 'Member Banned', value: 'guildBanAdd' },
        { label: 'Member Unbanned', value: 'guildBanRemove' },
        { label: 'Member Kicked', value: 'memberKick' },
        { label: 'Timeout Given/Removed', value: 'memberTimeout' },
        { label: 'Mod Command Used', value: 'modCommand' }
    ],
    cat_server: [
        { label: 'Channel Created', value: 'channelCreate' },
        { label: 'Channel Deleted', value: 'channelDelete' },
        { label: 'Channel Updated', value: 'channelUpdate' },
        { label: 'Role Created', value: 'roleCreate' },
        { label: 'Role Deleted', value: 'roleDelete' },
        { label: 'Role Updated', value: 'roleUpdate' },
        { label: 'Server Updated', value: 'guildUpdate' },
        { label: 'Invite Created/Deleted', value: 'inviteUpdate' }
    ],
    cat_member: [
        { label: 'Member Joined', value: 'guildMemberAdd' },
        { label: 'Member Left', value: 'guildMemberRemove' },
        { label: 'Nickname Changed', value: 'memberNickname' },
        { label: 'Role Given/Removed', value: 'memberRoleUpdate' }
    ],
    cat_msg: [
        { label: 'Message Deleted', value: 'messageDelete' },
        { label: 'Message Edited', value: 'messageUpdate' }
    ],
    cat_voice: [
        { label: 'Voice Joined', value: 'voiceJoin' },
        { label: 'Voice Left', value: 'voiceLeave' },
        { label: 'Voice Moved', value: 'voiceMove' },
        { label: 'Voice State (Mute/Deaf)', value: 'voiceState' }
    ]
};

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.customId || !interaction.customId.startsWith('logset_')) return;

        const guildId = interaction.guild.id;
        const settings = await db.getGuildSettings(guildId);
        let logs = settings.logs || {};

        try {
            // 1. KATEGORİ SEÇİMİ
            if (interaction.isStringSelectMenu() && interaction.customId === 'logset_category_select') {
                const category = interaction.values[0];
                const options = LOG_TYPES[category];

                if (!options) return;

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`logset_update_${category}`)
                    .setPlaceholder('Select events to ENABLE (Multiple)...')
                    .setMinValues(0)
                    .setMaxValues(options.length)
                    .addOptions(options.map(opt => ({
                        label: opt.label,
                        value: opt.value,
                        default: logs[opt.value] === true
                    })));

                await interaction.reply({
                    content: `⚙️ **Configure ${category.replace('cat_', '').toUpperCase()} Logs**\nSelect the events you want to track:`,
                    components: [new ActionRowBuilder().addComponents(selectMenu)],
                    ephemeral: true
                });
            }

            // 2. AYARLARI KAYDETME
            else if (interaction.isStringSelectMenu() && interaction.customId.startsWith('logset_update_')) {
                await interaction.deferUpdate();
                const category = interaction.customId.replace('logset_update_', '');
                const selectedEvents = interaction.values;
                const allCategoryEvents = LOG_TYPES[category].map(o => o.value);

                allCategoryEvents.forEach(evt => {
                    logs[evt] = selectedEvents.includes(evt);
                });

                await db.saveGuildSettings(guildId, { logs });
                await interaction.editReply({ content: `✅ **${category.replace('cat_', '').toUpperCase()}** settings updated!`, components: [] });
            }

            // 3. HEPSİNİ AÇ
            else if (interaction.isButton() && interaction.customId === 'logset_enable_all') {
                await interaction.deferReply({ ephemeral: true });
                Object.values(LOG_TYPES).flat().forEach(opt => logs[opt.value] = true);
                await db.saveGuildSettings(guildId, { logs });
                await interaction.editReply({ content: '✅ **ALL** log systems enabled!' });
            }

            // 4. HEPSİNİ KAPAT
            else if (interaction.isButton() && interaction.customId === 'logset_disable_all') {
                await interaction.deferReply({ ephemeral: true });
                const channelId = logs.channelId;
                logs = { channelId }; // Sadece kanalı tut
                await db.saveGuildSettings(guildId, { logs });
                await interaction.editReply({ content: '🗑️ **ALL** log systems disabled.' });
            }

            // 5. DURUM KONTROL
            else if (interaction.isButton() && interaction.customId === 'logset_status') {
                await interaction.deferReply({ ephemeral: true });
                const activeLogs = Object.entries(logs).filter(([k, v]) => v === true && k !== 'channelId').map(([k]) => `\`${k}\``);
                const embed = new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('📊 Log System Status')
                    .setDescription(`**Active Channel:** ${logs.channelId ? `<#${logs.channelId}>` : 'None'}\n\n**Enabled Events:**\n${activeLogs.join(', ') || 'None'}`);
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Log Settings Error:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
            }
        }
    },
};