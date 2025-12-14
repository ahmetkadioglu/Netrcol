// commands/economy/blackjack.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play a game of Blackjack against the dealer')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Amount to bet')
                .setRequired(true)
                .setMinValue(50)
        ),
    async execute(interaction) {
        const bet = interaction.options.getInteger('amount');
        const balance = await db.getUserBalance(interaction.user.id, interaction.guild.id);

        if (balance < bet) {
            return interaction.reply({ content: `❌ You don't have enough money! Balance: **$${balance}**`, ephemeral: true });
        }

        // Kart Destesi
        const suits = ['♠️', '♥️', '♦️', '♣️'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        let deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }

        // Kart Çekme Fonksiyonu
        const drawCard = () => {
            const index = Math.floor(Math.random() * deck.length);
            return deck.splice(index, 1)[0];
        };

        // Skor Hesaplama
        const calculateScore = (hand) => {
            let score = 0;
            let aces = 0;

            for (let card of hand) {
                if (['J', 'Q', 'K'].includes(card.value)) {
                    score += 10;
                } else if (card.value === 'A') {
                    aces += 1;
                    score += 11;
                } else {
                    score += parseInt(card.value);
                }
            }

            while (score > 21 && aces > 0) {
                score -= 10;
                aces -= 1;
            }
            return score;
        };

        // Oyunu Başlat
        const playerHand = [drawCard(), drawCard()];
        const dealerHand = [drawCard(), drawCard()];

        // Butonlar
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bj_hit').setLabel('Hit (Kart Çek)').setStyle(ButtonStyle.Primary).setEmoji('🃏'),
            new ButtonBuilder().setCustomId('bj_stand').setLabel('Stand (Kal)').setStyle(ButtonStyle.Secondary).setEmoji('🛑')
        );

        const generateEmbed = (revealDealer = false) => {
            const playerScore = calculateScore(playerHand);
            const dealerScore = calculateScore(dealerHand); // Sadece finalde kullanılır

            let dealerString = revealDealer 
                ? dealerHand.map(c => `[${c.suit} ${c.value}]`).join(' ') 
                : `[${dealerHand[0].suit} ${dealerHand[0].value}] [??]`;

            let dealerValue = revealDealer ? dealerScore.toString() : '?';

            return new EmbedBuilder()
                .setColor('#2F3136')
                .setAuthor({ name: `${interaction.user.username}'s Blackjack Game`, iconURL: interaction.user.displayAvatarURL() })
                .addFields(
                    { name: `Your Hand (${playerScore})`, value: playerHand.map(c => `[${c.suit} ${c.value}]`).join(' '), inline: true },
                    { name: `Dealer Hand (${dealerValue})`, value: dealerString, inline: true }
                )
                .setFooter({ text: `Bet: $${bet}` });
        };

        const msg = await interaction.reply({ embeds: [generateEmbed(false)], components: [row], fetchReply: true });

        // Collector (Buton dinleyici)
        const collector = msg.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 60000 
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'Not your game!', ephemeral: true });

            if (i.customId === 'bj_hit') {
                playerHand.push(drawCard());
                const score = calculateScore(playerHand);

                if (score > 21) {
                    // Kaybettin (Bust)
                    collector.stop('bust');
                    await db.removeMoney(interaction.user.id, interaction.guild.id, bet);
                    
                    const loseEmbed = generateEmbed(true)
                        .setColor('#ED4245')
                        .setTitle('💥 BUST! You went over 21.');
                    
                    await i.update({ embeds: [loseEmbed], components: [] });
                } else if (score === 21) {
                    // Otomatik Stand
                    collector.stop('stand'); // Bu kısmı aşağıda 'end' eventinde işleyeceğiz ama burada manuel tetiklememek için i.update yapıp bitirmek daha temiz olabilir.
                    // Ancak basitlik adına burada sadece kartı gösterip akışa bırakıyoruz, kullanıcı stand diyebilir veya biz zorlayabiliriz.
                    // Biz kullanıcıya bırakalım, belki 5 kart kuralı vs eklenir ilerde.
                    await i.update({ embeds: [generateEmbed(false)], components: [row] });
                } else {
                    await i.update({ embeds: [generateEmbed(false)], components: [row] });
                }
            } 
            
            else if (i.customId === 'bj_stand') {
                collector.stop('stand');
                
                // Dealer Oynuyor
                let dealerScore = calculateScore(dealerHand);
                while (dealerScore < 17) {
                    dealerHand.push(drawCard());
                    dealerScore = calculateScore(dealerHand);
                }

                const playerScore = calculateScore(playerHand);
                let resultEmbed = generateEmbed(true);
                let resultMsg = '';

                if (dealerScore > 21) {
                    resultMsg = '🎉 Dealer Bust! You Win!';
                    resultEmbed.setColor('#57F287');
                    await db.addMoney(interaction.user.id, interaction.guild.id, bet); // 1x kar
                } else if (dealerScore > playerScore) {
                    resultMsg = '❌ Dealer Wins!';
                    resultEmbed.setColor('#ED4245');
                    await db.removeMoney(interaction.user.id, interaction.guild.id, bet);
                } else if (playerScore > dealerScore) {
                    resultMsg = '✅ You Win!';
                    resultEmbed.setColor('#57F287');
                    await db.addMoney(interaction.user.id, interaction.guild.id, bet);
                } else {
                    resultMsg = '🤝 Push (Tie). Money returned.';
                    resultEmbed.setColor('#FEE75C');
                    // Para değişmez
                }

                resultEmbed.setTitle(resultMsg);
                await i.update({ embeds: [resultEmbed], components: [] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                msg.edit({ content: '⏳ Time up! Game cancelled.', components: [] });
            }
        });
    },
};