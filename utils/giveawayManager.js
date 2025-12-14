// utils/giveawayManager.js - UPDATED EMBED & BUTTONS
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('./database');

class GiveawayManager {
    constructor() {
        this.interval = null;
    }

    init(client) {
        this.client = client;
        this.checkGiveaways();
        this.interval = setInterval(() => this.checkGiveaways(), 15 * 1000);
        console.log('🎉 Giveaway Manager initialized');
    }

    async checkGiveaways() {
        try {
            const giveaways = await db.getActiveGiveaways();
            const now = Date.now();
            for (const giveaway of giveaways) {
                if (now >= giveaway.endTime) {
                    await this.finishGiveaway(giveaway);
                }
            }
        } catch (error) {
            console.error('Giveaway check error:', error);
        }
    }

    async start(interaction, durationMs, winnerCount, prize, requiredRoleId = null) {
        const endTime = Date.now() + durationMs;

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎉 GIVEAWAY STARTED! 🎉')
            .setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
            .addFields(
                { name: 'Hosted By', value: `${interaction.user}`, inline: true },
                { name: 'Participants', value: '0', inline: true } // SAYAÇ BURADA
            )
            .setFooter({ text: 'Click the button below to join!' })
            .setTimestamp(endTime);

        if (requiredRoleId) {
            embed.addFields({ name: 'Required Role', value: `<@&${requiredRoleId}>`, inline: true });
        }

        const joinBtn = new ButtonBuilder()
            .setCustomId('join_giveaway')
            .setLabel('Join Giveaway')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎉');

        // LİSTELEME BUTONU (Aktif)
        const listBtn = new ButtonBuilder()
            .setCustomId('giveaway_participants')
            .setLabel('View Participants')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👥');

        const msg = await interaction.channel.send({ 
            embeds: [embed], 
            components: [new ActionRowBuilder().addComponents(joinBtn, listBtn)] 
        });

        await db.createGiveaway({
            messageId: msg.id,
            channelId: interaction.channel.id,
            guildId: interaction.guild.id,
            hostId: interaction.user.id,
            prize,
            winnerCount,
            endTime,
            requiredRoleId,
            participants: [],
            ended: false
        });

        return msg.url;
    }

    async finishGiveaway(giveaway) {
        try {
            const channel = await this.client.channels.fetch(giveaway.channelId).catch(() => null);
            if (!channel) return await db.endGiveaway(giveaway.messageId, []);

            const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
            if (!message) return await db.endGiveaway(giveaway.messageId, []);

            const winners = this.pickWinners(giveaway.participants, giveaway.winnerCount);
            const winnerText = winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No valid entries.';

            const endEmbed = EmbedBuilder.from(message.embeds[0])
                .setColor('#2B2D31')
                .setTitle('🎉 GIVEAWAY ENDED 🎉')
                .setDescription(`**Prize:** ${giveaway.prize}\n**Winner(s):** ${winnerText}\n**Hosted By:** <@${giveaway.hostId}>`)
                .setFooter({ text: 'Giveaway Ended' });

            // Butonları pasif yap
            const disabledJoin = new ButtonBuilder().setCustomId('join_giveaway').setLabel('Ended').setStyle(ButtonStyle.Secondary).setEmoji('🏁').setDisabled(true);
            const disabledList = new ButtonBuilder().setCustomId('giveaway_participants').setLabel('Participants').setStyle(ButtonStyle.Secondary).setEmoji('👥').setDisabled(true);

            await message.edit({ embeds: [endEmbed], components: [new ActionRowBuilder().addComponents(disabledJoin, disabledList)] });
            
            if (winners.length > 0) {
                await channel.send(`🎉 Congratulations ${winnerText}! You won **${giveaway.prize}**!`);
            } else {
                await channel.send('❌ Giveaway ended, but no one joined.');
            }

            await db.endGiveaway(giveaway.messageId, winners);

        } catch (error) {
            console.error('Error finishing giveaway:', error);
        }
    }

    async reroll(interaction, messageId) {
        const giveaway = await db.getGiveaway(messageId);
        if (!giveaway || !giveaway.ended) return 'Giveaway not found or not ended yet.';
        const winner = this.pickWinners(giveaway.participants, 1);
        if (winner.length > 0) {
            await interaction.channel.send(`🎉 **New Winner:** <@${winner[0]}>! Prize: **${giveaway.prize}**`);
            return 'Reroll successful.';
        } else {
            return 'Not enough participants.';
        }
    }

    pickWinners(participants, count) {
        if (!participants || participants.length === 0) return [];
        const shuffled = participants.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}

module.exports = new GiveawayManager();