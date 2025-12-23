const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a list of all available commands'),

    async execute(interaction) {
        await interaction.deferReply();

        // 1. ADIM: Hem Global hem de Sunucu komutlarını çekip birleştiriyoruz.
        // Bu sayede komut "Guild Only" olsa bile bulunur ve linklenir.
        const globalCommands = await interaction.client.application.commands.fetch().catch(() => new Collection());
        const guildCommands = await interaction.guild.commands.fetch().catch(() => new Collection());
        
        // İki listeyi birleştir (Aynı isim varsa guild komutu öncelikli olsun)
        const allCommands = new Collection().concat(globalCommands, guildCommands);

        // 2. ADIM: Komut Bulucu Fonksiyon
        const c = (name) => {
            // "giveaway start" gibi alt komutlu isimleri parçala, sadece kök ismi ("giveaway") al
            const baseName = name.split(' ')[0]; 
            
            // Birleştirilmiş listede bu isme sahip komutu bul
            const cmd = allCommands.find(cmd => cmd.name === baseName);

            // Komut bulunduysa linkle (</isim:ID>), bulunamadıysa düz yazı (`/isim`) yap
            return cmd ? `</${name}:${cmd.id}>` : `\`/${name}\``;
        };

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔥 Netrcol Bot Commands')
            .setDescription('Here is the complete list of commands to manage your server and have fun. **Click on any command to use it!**')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .addFields(
                { 
                    name: '💰 Economy & Fun', 
                    value: `${c('daily')} · ${c('balance')} · ${c('coinflip')} · ${c('slots')} · ${c('blackjack')}`, 
                    inline: false 
                },
                { 
                    name: '🎮 Server Games', 
                    value: `${c('wordgame-setup')} · ${c('counting-setup')}`, 
                    inline: false 
                },
                { 
                    name: '📈 Level System', 
                    value: `${c('level')} (Check Rank) · ${c('leaderboard')} (Top 10)`, 
                    inline: false 
                },
                { 
                    name: '💡 Suggestion System', 
                    value: `${c('suggest')} · ${c('suggestion setup')} · ${c('suggestion')}`,
                    inline: false 
                },
                { 
                    name: '🎫 Ticket System', 
                    value: `${c('ticket-setup')} · ${c('ticket-settings')} · ${c('ticket-disable')}\n${c('ticket-close')} · ${c('topic-add')} · ${c('topic-clear')}`, 
                    inline: false 
                },
                { 
                    name: '📝 Registration System', 
                    value: `${c('regist-setup')} · ${c('regist-settings')} · ${c('regist-disable')}`, 
                    inline: false 
                },
                { 
                    name: '🛡️ Moderation & Jail', 
                    value: `${c('jail')} · ${c('unjail')} · ${c('jail-setup')}\n${c('warn')} · ${c('warnings')}\n${c('ban')} · ${c('unban')} · ${c('kick')} · ${c('timeout')} · ${c('untimeout')}\n${c('lock')} · ${c('unlock')} · ${c('clear')}`, 
                    inline: false 
                },
                { 
                    name: '🎁 Giveaways', 
                    value: `${c('giveaway start')} · ${c('giveaway end')} · ${c('giveaway reroll')}`, 
                    inline: false 
                },
                { 
                    name: '🔊 Voice & Welcome', 
                    value: `${c('jtc-setup')} (Join to Create Room)\n${c('welcome setup')} · ${c('welcome test')} · ${c('welcome disable')}`, 
                    inline: false 
                },
                { 
                    name: '📜 Logging & System', 
                    value: `${c('logs-setup')} · ${c('logs-edit')} · ${c('logs-disable')}\n${c('maintenance')} (Admin Only) · ${c('backup')}`, 
                    inline: false 
                },
                { 
                    name: '📊 Information', 
                    value: `${c('stats')} · ${c('serverinfo')} · ${c('botinfo')} · ${c('ping')}`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Netrcol Bot v0.2.8 • Developed By Netrcol\n💡 If you encounter any issues, please ask for help in the Support Server.' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/qdHMbvtAVd')
                    .setEmoji('🛡️'),
                
                new ButtonBuilder()
                    .setLabel('Add Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`)
                    .setEmoji('➕')
            );

        await interaction.editReply({ embeds: [embed], components: [row] });
    },
};