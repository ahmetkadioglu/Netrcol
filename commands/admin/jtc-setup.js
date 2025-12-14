// commands/admin/jtc-setup.js
const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jtc-setup')
        .setDescription('Setup "Join to Create" voice system')
        .addChannelOption(opt => 
            opt.setName('channel')
                .setDescription('The voice channel users will join to create a room')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin permission required.', flags: 64 });
        }

        const channel = interaction.options.getChannel('channel');

        await db.saveJTCSettings(interaction.guild.id, {
            enabled: true,
            triggerChannelId: channel.id,
            categoryId: channel.parentId // Oluşan odalar bu kategoriye gider
        });

        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ JTC System Configured')
            .setDescription(`**Trigger Channel:** ${channel}\n**Category ID:** ${channel.parentId || 'None'}\n\nUsers joining this channel will now have their own private rooms.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};