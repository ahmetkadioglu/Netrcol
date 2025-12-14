// commands/admin/welcome.js - WELCOME SYSTEM SETUP
const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure the welcome system')
        .addSubcommand(sub => 
            sub.setName('setup')
                .setDescription('Setup welcome channel and type')
                .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send welcome messages').addChannelTypes(ChannelType.GuildText).setRequired(true))
                .addStringOption(opt => opt.setName('type').setDescription('Type of welcome message').setRequired(true).addChoices({ name: '🖼️ Image (Canvas)', value: 'image' }, { name: '📝 Text (Embed)', value: 'text' }))
                .addStringOption(opt => opt.setName('image_url').setDescription('Background image URL (Only for Image type)').setRequired(false))
                .addStringOption(opt => opt.setName('message').setDescription('Custom message (Variables: {user}, {server}, {count})').setRequired(false))
        )
        .addSubcommand(sub => 
            sub.setName('disable')
                .setDescription('Disable the welcome system')
        )
        .addSubcommand(sub => 
            sub.setName('test')
                .setDescription('Test the welcome message')
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Administrator permission required.', flags: 64 });
        }

        const sub = interaction.options.getSubcommand();

        if (sub === 'setup') {
            const channel = interaction.options.getChannel('channel');
            const type = interaction.options.getString('type');
            const bgUrl = interaction.options.getString('image_url');
            const message = interaction.options.getString('message');

            await db.saveWelcomeSettings(interaction.guild.id, {
                enabled: true,
                channelId: channel.id,
                type: type,
                backgroundUrl: bgUrl,
                customMessage: message
            });

            const embed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('✅ Welcome System Setup')
                .setDescription(`Welcome system has been enabled in ${channel}.`)
                .addFields(
                    { name: 'Type', value: type === 'image' ? '🖼️ Image Card' : '📝 Text Embed', inline: true },
                    { name: 'Background', value: bgUrl ? '[Link Set]' : 'Default', inline: true },
                    { name: 'Message', value: message || 'Default', inline: false }
                );

            await interaction.reply({ embeds: [embed] });
        } 
        else if (sub === 'disable') {
            await db.saveWelcomeSettings(interaction.guild.id, { enabled: false });
            await interaction.reply({ content: '🚫 Welcome system disabled.' });
        }
        else if (sub === 'test') {
            // Test için event simülasyonu
            const { welcomeMember } = require('../../events/memberEvents');
            await interaction.reply({ content: '🔄 Sending test message...', flags: 64 });
            await welcomeMember(interaction.member);
        }
    },
};