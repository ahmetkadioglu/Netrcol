const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ticketManager = require('../../utils/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topic-add')
        .setDescription('Add a new ticket topic (Custom topics override default ones)')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Topic name (e.g. Billing Support)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Topic description')
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('staff_role')
                .setDescription('Specific staff role for this topic')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Topic emoji')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin permission required.', flags: 64 });
        }

        const name = interaction.options.getString('name');
        const description = interaction.options.getString('description');
        const staffRole = interaction.options.getRole('staff_role');
        const emoji = interaction.options.getString('emoji');

        const success = await ticketManager.addTopic(interaction.guild.id, name, description, emoji, staffRole);

        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Topic Added')
                .setDescription(`New topic **${name}** has been added.\n\nℹ️ *Note: Since you added a custom topic, default topics (Server, Help etc.) will no longer be shown.*`)
                .addFields(
                    { name: 'Name', value: name, inline: true },
                    { name: 'Emoji', value: emoji || '🎫', inline: true },
                    { name: 'Staff Role', value: staffRole ? staffRole.toString() : 'Default', inline: true }
                );
            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply({ content: '❌ Failed to add topic.', flags: 64 });
        }
    },
};