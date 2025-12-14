// commands/registration/regist-setup.js - VERIFICATION ENABLED
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('regist-setup')
        .setDescription('Setup the registration system'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required!', flags: 64 });
        }

        const settings = await db.getRegistrationSettings(interaction.guild.id);
        if (settings && (settings.interactive || settings.button || settings.verification)) {
            return interaction.reply({ 
                content: '⚠️ **Registration system is already setup!**\nUse `/regist-disable` first.', 
                flags: 64 
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📝 Registration System Setup')
            .setDescription('Select the type of registration system:')
            .addFields(
                { name: '💬 Interactive', value: 'Form based (Name/Age).', inline: false },
                { name: '🛡️ Verification (Captcha)', value: 'Anti-bot system. Users solve a math problem to join.', inline: false },
                { name: '🔘 Button', value: 'One-click instant role.', inline: false }
            )
            .setFooter({ text: 'Netrcol Bot v0.2.8' }).setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reg_setup_interactive').setLabel('Interactive').setStyle(ButtonStyle.Primary).setEmoji('💬'),
            new ButtonBuilder().setCustomId('reg_setup_verification').setLabel('Verification').setStyle(ButtonStyle.Success).setEmoji('🛡️'), // AKTİF EDİLDİ
            new ButtonBuilder().setCustomId('reg_setup_button').setLabel('Button').setStyle(ButtonStyle.Secondary).setEmoji('🔘')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};