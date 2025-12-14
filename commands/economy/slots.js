const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine')
        .addIntegerOption(option => 
            option.setName('amount').setDescription('Amount to bet').setRequired(true).setMinValue(50)
        ),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const balance = await db.getUserBalance(interaction.user.id, interaction.guild.id);

        if (balance < amount) {
            return interaction.reply({ content: `❌ You don't have enough money! Your balance: **$${balance}**`, ephemeral: true });
        }

        // Slot Meyveleri
        const slots = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
        const slot1 = slots[Math.floor(Math.random() * slots.length)];
        const slot2 = slots[Math.floor(Math.random() * slots.length)];
        const slot3 = slots[Math.floor(Math.random() * slots.length)];

        let multiplier = 0;
        let message = '';

        // Kazanma Mantığı
        if (slot1 === slot2 && slot2 === slot3) {
            // Jackpot (3'ü aynı)
            multiplier = 5;
            message = 'JACKPOT! 5x Win!';
        } else if (slot1 === slot2 || slot1 === slot3 || slot2 === slot3) {
            // 2'si aynı
            multiplier = 2;
            message = 'Nice! 2x Win!';
        } else {
            // Kayıp
            multiplier = 0;
            message = 'You lost...';
        }

        // Para İşlemleri
        if (multiplier > 0) {
            const winnings = amount * multiplier;
            await db.addMoney(interaction.user.id, interaction.guild.id, winnings - amount); // Kar ekle
        } else {
            await db.removeMoney(interaction.user.id, interaction.guild.id, amount);
        }

        const embed = new EmbedBuilder()
            .setColor(multiplier > 0 ? '#57F287' : '#ED4245')
            .setTitle('🎰 Slot Machine')
            .setDescription(`
                **[ ${slot1} | ${slot2} | ${slot3} ]**
                
                ${message}
                ${multiplier > 0 ? `Won: **$${amount * multiplier}**` : `Lost: **$${amount}**`}
            `);

        await interaction.reply({ embeds: [embed] });
    },
};