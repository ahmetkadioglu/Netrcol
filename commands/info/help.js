// commands/info/help.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all available commands'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔥 Netrcol Bot Commands')
            .setDescription('Here is the complete list of commands to manage your server and have fun.')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { 
                    name: '💰 Economy & Fun', 
                    value: '`/daily` · `/balance` · `/coinflip` · `/slots` · `/blackjack`', 
                    inline: false 
                },
                { 
                    name: '🎮 Server Games', 
                    value: '`/wordgame-setup` · `/counting-setup`', 
                    inline: false 
                },
                { 
                    name: '📈 Level System', 
                    value: '`/level` (Check Rank) · `/leaderboard` (Top 10)', 
                    inline: false 
                },
                { 
                    name: '💡 Suggestion System', 
                    value: '`/suggest` · `/suggestion-setup` · `/suggestion` (Accept/Deny)', 
                    inline: false 
                },
                { 
                    name: '🎫 Ticket System', 
                    value: '`/ticket-setup` · `/ticket-settings` · `/ticket-disable`\n`/ticket-close` · `/topic-add` · `/topic-clear`', 
                    inline: false 
                },
                { 
                    name: '📝 Registration System', 
                    value: '`/regist-setup` · `/regist-settings` · `/regist-disable`', 
                    inline: false 
                },
                { 
                    name: '🛡️ Moderation & Jail', 
                    value: '`/jail` · `/unjail` · `/jail-setup`\n`/warn` · `/warnings`\n`/ban` · `/unban` · `/kick` · `/timeout` · `/untimeout`\n`/lock` · `/unlock` · `/clear`', 
                    inline: false 
                },
                { 
                    name: '🎁 Giveaways', 
                    value: '`/giveaway start` · `/giveaway end` · `/giveaway reroll`', 
                    inline: false 
                },
                { 
                    name: '🔊 Voice & Welcome', 
                    value: '`/jtc-setup` (Join to Create Room)\n`/welcome setup` · `/welcome test` · `/welcome disable`', 
                    inline: false 
                },
                { 
                    name: '📜 Logging & System', 
                    value: '`/logs-setup` · `/logs-edit` · `/logs-disable`\n`/maintenance` (Admin Only) · `/backup`', 
                    inline: false 
                },
                { 
                    name: '📊 Information', 
                    value: '`/stats` · `/serverinfo` · `/botinfo` · `/ping`', 
                    inline: false 
                }
            )
            .setFooter({ text: 'Netrcol Bot v0.2.8 • Developed By Netrcol' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};