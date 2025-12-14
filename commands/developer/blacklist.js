const { SlashCommandBuilder } = require('discord.js');
const db = require('../../utils/database');
const config = require('../../config/config');
const devLogger = require('../../utils/devLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Developer Only: Block a user from using the bot')
        .addStringOption(opt => opt.setName('userid').setDescription('User ID').setRequired(true))
        .addStringOption(opt => opt.setName('action').setDescription('Add or Remove').setRequired(true).addChoices({name:'Add', value:'add'}, {name:'Remove', value:'remove'}))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
    async execute(interaction) {
        if (interaction.user.id !== config.ownerId) return interaction.reply({ content: '❌ Developer only.', ephemeral: true });

        const userId = interaction.options.getString('userid');
        const action = interaction.options.getString('action');
        const reason = interaction.options.getString('reason') || 'No reason';

        try {
            const targetUser = await interaction.client.users.fetch(userId); // Kullanıcıyı bul (isim logu için)

            if (action === 'add') {
                await db.addBlacklist(userId, reason, interaction.user.id);
                await devLogger.sendLog(interaction.client, 'blacklist', { user: targetUser, action: 'Added', moderatorId: interaction.user.id, reason });
                interaction.reply(`⛔ User **${targetUser.tag}** added to blacklist.`);
            } else {
                await db.removeBlacklist(userId);
                await devLogger.sendLog(interaction.client, 'blacklist', { user: targetUser, action: 'Removed', moderatorId: interaction.user.id, reason });
                interaction.reply(`✅ User **${targetUser.tag}** removed from blacklist.`);
            }
        } catch (e) {
            interaction.reply('❌ User not found or error.');
        }
    }
};