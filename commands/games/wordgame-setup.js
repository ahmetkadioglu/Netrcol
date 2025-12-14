// commands/games/wordgame-setup.js
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../../utils/database');

const startWords = ['Discord', 'Apple', 'Lemon', 'Tiger', 'Robot', 'Magic', 'Power', 'Gamer'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordgame-setup')
        .setDescription('Setup the Word Chain game in a channel')
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
        const firstWord = startWords[Math.floor(Math.random() * startWords.length)];

        // Veritabanına kaydet
        await db.setWordGame(interaction.guild.id, {
            channelId: channel.id,
            lastWord: firstWord,
            lastUser: interaction.client.user.id, // İlk kelime botun
            count: 0
        });

        // Kanalı temizle (Opsiyonel, temiz bir başlangıç için)
        // await channel.bulkDelete(100).catch(() => {}); 

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎮 Word Chain Game Started!')
            .setDescription(`**Rules:**\n1. Write a word starting with the **last letter** of the previous word.\n2. You cannot write two words in a row.\n3. Chatting is restricted! Use \`.\` prefix to chat (e.g. \`.hello\`).\n\n🔹 **First Word:**`)
            .addFields({ name: '🔤 Current Word', value: `# **${firstWord.toUpperCase()}**` })
            .setFooter({ text: `Ends with: ${firstWord.slice(-1).toUpperCase()}` });

        await channel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Game initialized in ${channel}!`, flags: 64 });
    },
};