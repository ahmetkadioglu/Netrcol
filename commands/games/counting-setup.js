// commands/games/counting-setup.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting-setup')
        .setDescription('Setup the Counting game in a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to host the game')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required.', flags: 64 });
        }

        const channel = interaction.options.getChannel('channel');

        // Veritabanına kaydet (Sayı 0'dan başlar, bir sonraki 1 olmalı)
        await db.setCountingGame(interaction.guild.id, {
            channelId: channel.id,
            currentNumber: 0,
            lastUser: null
        });

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔢 Counting Game Started!')
            .setDescription(`**Rules:**\n1. Start counting from **1**.\n2. You cannot count twice in a row.\n3. If you make a mistake, the counter resets to 0!`)
            .setFooter({ text: 'Let the counting begin!' });

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Counting game initialized in ${channel}!`, flags: 64 });
    },
};