// commands/tickets/ticket-setup.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('Start the ticket system setup wizard'),
    async execute(interaction) {
        // Yetki Kontrolü
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required.', flags: 64 });
        }

        // HATA ÇÖZÜMÜ: Buradaki eski 'ticketManager.startSetup' satırı kaldırıldı.
        // Artık kurulumu butonlar başlatacak.

        // Adım 1: Sistem Türünü Seçtirme Ekranı
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🛠️ Ticket System Setup')
            .setDescription('Please select the type of ticket system you want to install:\n\n' +
                '**🔹 Standard System:** Classic ticket system. Users open tickets and chat directly in the channel.\n\n' +
                '**🕵️ Anonymous System:** Identities are hidden based on settings. Communication happens via Bot DMs (Proxy).')
            .setFooter({ text: 'Step 1: Select System Type' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('setup_type_standard')
                .setLabel('Standard System')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🔹'),
            new ButtonBuilder()
                .setCustomId('setup_type_anonymous')
                .setLabel('Anonymous System')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🕵️')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};