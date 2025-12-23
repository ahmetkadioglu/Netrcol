const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestion')
        .setDescription('Manage suggestion system')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set the suggestion channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select channel').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('accept')
                .setDescription('Accept a suggestion')
                .addStringOption(option => option.setName('message_id').setDescription('Message ID').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('deny')
                .setDescription('Deny a suggestion')
                .addStringOption(option => option.setName('message_id').setDescription('Message ID').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true))),
    async execute(interaction) {
        await interaction.reply({ content: '⚙️ System setup logic goes here.', ephemeral: true });
    },
};