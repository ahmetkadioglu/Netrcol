const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const ticketManager = require('../../utils/ticketManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topic-settings')
        .setDescription('List current ticket topics'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin permission required.', flags: 64 });
        }

        const topics = await ticketManager.getAvailableTopics(interaction.guild.id);
        const isDefault = topics[0].id === 'server' && topics[3].id === 'complaint'; // Basit kontrol

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(isDefault ? '📂 Default Topics Active' : '📂 Custom Topics Active')
            .setDescription(isDefault ? 'You are using default topics because no custom topics have been added.' : 'You are using custom topics.')
            .setFooter({ text: `Total: ${topics.length} topics` });

        topics.forEach(t => {
            embed.addFields({
                name: `${t.emoji || '🎫'} ${t.name}`,
                value: `ID: \`${t.id}\`\n${t.description || ''}`,
                inline: true
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};