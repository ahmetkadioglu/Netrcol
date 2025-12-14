const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/database');
const config = require('../../config/config');
const devLogger = require('../../utils/devLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Developer Only: Manage premium guilds')
        .addStringOption(opt => opt.setName('guildid').setDescription('Guild ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('days').setDescription('Days to add').setRequired(true)),
    async execute(interaction) {
        if (interaction.user.id !== config.ownerId) return interaction.reply({ content: '❌ Developer only.', ephemeral: true });

        const guildId = interaction.options.getString('guildid');
        const days = interaction.options.getInteger('days');

        const expiresAt = await db.addPremium(guildId, days, interaction.user.id);
        
        await devLogger.sendLog(interaction.client, 'premium', { 
            guildId, days, moderatorId: interaction.user.id, expiresAt 
        });

        interaction.reply(`💎 Premium added to Guild \`${guildId}\` for **${days}** days.`);
    }
};