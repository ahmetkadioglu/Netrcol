const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');
const helpers = require('../../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unjail')
        .setDescription('Unjail a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to unjail').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '❌ Permission denied.', flags: 64 });
        }

        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        
        const jailData = await db.getJail(interaction.guild.id, user.id);
        if (!jailData) return interaction.reply({ content: '❌ This user is not in jail database.', flags: 64 });

        const jailRole = interaction.guild.roles.cache.find(r => r.name === 'Jailed');
        
        if (member) {
            // Rolleri geri ver
            if (jailRole) await member.roles.remove(jailRole);
            if (jailData.roles && jailData.roles.length > 0) {
                await member.roles.add(jailData.roles).catch(e => console.log('Role add error:', e));
            }
        }

        // DB'den sil
        await db.removeJail(interaction.guild.id, user.id);

        await interaction.reply({ embeds: [new EmbedBuilder().setColor('#57F287').setTitle('🔓 User Unjailed').setDescription(`${user} has been released.`)] });

        // Log
        await helpers.sendLog(interaction.guild, {
            type: 'member_unjail',
            title: '🔓 Member Unjailed',
            description: `**${user.tag}** was released from jail.`,
            color: '#57F287'
        });
    },
};