const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');
const helpers = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jail')
        .setDescription('Jail a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to jail').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '❌ Permission denied.', flags: 64 });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason';
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);

        if (!member) return interaction.reply({ content: '❌ User not found.', flags: 64 });
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: '❌ You cannot jail this user.', flags: 64 });
        }

        const jailRole = interaction.guild.roles.cache.find(r => r.name === 'Jailed');
        if (!jailRole) return interaction.reply({ content: '❌ "Jailed" role not found. Run `/jail-setup` first.', flags: 64 });

        // Eski rollerini kaydet
        const oldRoles = member.roles.cache.filter(r => r.name !== '@everyone').map(r => r.id);
        await db.setJail(interaction.guild.id, user.id, oldRoles);

        // Rolleri al ve Jail ver
        await member.roles.set([jailRole.id]).catch(e => console.log(e));

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('🔒 User Jailed')
            .addFields({ name: 'User', value: `${user.tag}` }, { name: 'Reason', value: reason });

        await interaction.reply({ embeds: [embed] });

        // Log
        await helpers.sendLog(interaction.guild, {
            type: 'member_jail',
            title: '🔒 Member Jailed',
            description: `**${user.tag}** was sent to jail.`,
            fields: [{ name: 'User', value: `${user}`, inline: true }, { name: 'Reason', value: reason, inline: true }],
            color: '#000000'
        });
    },
};