// commands/registration/regist-settings.js - ADDED TAG BUTTON & PARAMETERS
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regist-settings')
        .setDescription('Configure registration system settings'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin permission required.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Registration Settings')
            .setDescription('Configure the registration system behavior.')
            .addFields(
                { name: '📝 Name Format', value: 'Set nickname format.\n**Parameters:**\n`{user}`: Username\n`{age}`: Age\n`{count}`: Reg Count' },
                { name: '🏷️ Tag Settings', value: 'Set a tag symbol to be added to user nicknames.' },
                { name: '🎭 Registered Role', value: 'Set the role given upon registration.' },
                { name: '🔧 Options', value: 'Toggle Self-Register, Age Req, Tag Mode.' }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('regset_name_format').setLabel('Name Format').setStyle(ButtonStyle.Primary).setEmoji('📝'),
            new ButtonBuilder().setCustomId('regset_set_tag').setLabel('Set Tag').setStyle(ButtonStyle.Primary).setEmoji('🏷️'), // YENİ BUTON
            new ButtonBuilder().setCustomId('regset_registered_role').setLabel('Set Role').setStyle(ButtonStyle.Success).setEmoji('🎭'),
            new ButtonBuilder().setCustomId('regset_staff_role').setLabel('Staff Roles').setStyle(ButtonStyle.Secondary).setEmoji('👮')
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('regset_options').setLabel('Options').setStyle(ButtonStyle.Secondary).setEmoji('🔧')
        );

        await interaction.reply({ embeds: [embed], components: [row, row2], flags: 64 });
    },
};