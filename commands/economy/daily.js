const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily cash reward'),
    async execute(interaction) {
        const reward = 500; // Günlük ödül miktarı
        const result = await db.claimDaily(interaction.user.id, interaction.guild.id, reward);

        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('💰 Daily Reward Claimed!')
                .setDescription(`You received **$${reward}**! Come back tomorrow for more.`);
            
            await interaction.reply({ embeds: [embed] });
        } else {
            // Süre hesaplama (Milisaniye -> Saat/Dakika)
            const hours = Math.floor(result.timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((result.timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            await interaction.reply({ 
                content: `⏳ You have already claimed your daily reward!\nCome back in **${hours}h ${minutes}m**.`, 
                ephemeral: true 
            });
        }
    },
};