// commands/tickets/ticket-settings.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-settings') // İsim düzeltildi
        .setDescription('Customize the ticket system appearance and settings'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required.', flags: 64 });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Ticket System Customization')
            .setDescription('Select the component you want to customize:')
            .addFields(
                { name: '1️⃣ Creation Panel', value: 'Customize the message and buttons users see to create tickets.' },
                { name: '2️⃣ Ticket Channel', value: 'Customize the welcome message and buttons inside new tickets.' },
                { name: '3️⃣ Log Channel', value: 'Update the channel where ticket logs are sent.' }
            );

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('tset_menu_creation').setLabel('Creation Panel').setStyle(ButtonStyle.Primary).setEmoji('1️⃣'),
            new ButtonBuilder().setCustomId('tset_menu_channel').setLabel('Ticket Channel').setStyle(ButtonStyle.Primary).setEmoji('2️⃣'),
            new ButtonBuilder().setCustomId('tset_menu_logs').setLabel('Log Channel').setStyle(ButtonStyle.Secondary).setEmoji('3️⃣')
        );

        await interaction.reply({ embeds: [embed], components: [row], flags: 64 });
    },
};