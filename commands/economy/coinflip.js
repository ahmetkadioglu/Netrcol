const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Flip a coin and double your money')
        .addIntegerOption(option => 
            option.setName('amount').setDescription('Amount to bet').setRequired(true).setMinValue(10)
        )
        .addStringOption(option =>
            option.setName('side').setDescription('Heads or Tails?').setRequired(true)
                .addChoices({ name: 'Heads', value: 'heads' }, { name: 'Tails', value: 'tails' })
        ),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const choice = interaction.options.getString('side');
        const balance = await db.getUserBalance(interaction.user.id, interaction.guild.id);

        if (balance < amount) {
            return interaction.reply({ content: `❌ You don't have enough money! Your balance: **$${balance}**`, ephemeral: true });
        }

        // 50% Şans
        const outcomes = ['heads', 'tails'];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        const isWin = choice === result;

        const embed = new EmbedBuilder().setTitle('🪙 Coin Flip');

        if (isWin) {
            await db.addMoney(interaction.user.id, interaction.guild.id, amount); // Parayı 2'ye katla (yatırdığını geri al + kazan)
            embed.setColor('#57F287')
                .setDescription(`The coin landed on **${result.toUpperCase()}**!\n\n✅ **YOU WON!**\nAdded: **$${amount}**`);
        } else {
            await db.removeMoney(interaction.user.id, interaction.guild.id, amount);
            embed.setColor('#ED4245')
                .setDescription(`The coin landed on **${result.toUpperCase()}**!\n\n❌ **YOU LOST!**\nLost: **$${amount}**`);
        }

        await interaction.reply({ embeds: [embed] });
    },
};