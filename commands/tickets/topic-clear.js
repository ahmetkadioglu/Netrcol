const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topic-clear')
        .setDescription('Delete ALL custom topics (Restores default topics)'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Admin permission required.', flags: 64 });
        }

        const confirmBtn = new ButtonBuilder().setCustomId('confirm_clear_topics').setLabel('Yes, Delete All').setStyle(ButtonStyle.Danger);
        const cancelBtn = new ButtonBuilder().setCustomId('cancel_clear_topics').setLabel('Cancel').setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder().addComponents(confirmBtn, cancelBtn);

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('⚠️ Clear All Topics?')
            .setDescription('This will delete all **custom topics**.\nThe bot will revert to using **Default Topics** (Server, Help, Request, Complaint).');

        const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ time: 15000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Not your command.', flags: 64 });
            
            if (i.customId === 'confirm_clear_topics') {
                if (db.db) {
                    await db.db.collection('ticket_categories').deleteMany({ guildId: interaction.guild.id.toString() });
                }
                await i.update({ content: '✅ All custom topics deleted. Default topics are now active.', embeds: [], components: [] });
            } else {
                await i.update({ content: '✅ Cancelled.', embeds: [], components: [] });
            }
        });
    },
};