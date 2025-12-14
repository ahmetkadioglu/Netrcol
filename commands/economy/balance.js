const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your wallet balance')
        .addUserOption(option => 
            option.setName('user').setDescription('Check another user\'s balance').setRequired(false)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        const balance = await db.getUserBalance(target.id, interaction.guild.id);

        const embed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setAuthor({ name: `${target.username}'s Wallet`, iconURL: target.displayAvatarURL() })
            .setDescription(`**Cash:** $${balance.toLocaleString()}`)
            .setFooter({ text: 'Economy System' });

        await interaction.reply({ embeds: [embed] });
    },
};