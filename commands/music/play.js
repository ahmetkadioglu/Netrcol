const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Plays a song or playlist from YouTube, Spotify, etc.')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Song name, YouTube URL, or Spotify URL')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const player = interaction.client.player;
      if (!player) {
        return interaction.editReply('❌ **System Error:** Music player is not initialized.');
      }

      const query = interaction.options.getString('query', true);
      const voiceChannel = interaction.member?.voice?.channel;

      if (!voiceChannel) {
        return interaction.editReply('❌ You must be in a voice channel first!');
      }

      // Permissions (join + speak)
      const me = interaction.guild.members.me;
      const perms = voiceChannel.permissionsFor(me);
      if (!perms?.has(PermissionsBitField.Flags.Connect)) {
        return interaction.editReply('❌ I do not have permission to **CONNECT** to your voice channel.');
      }
      if (!perms?.has(PermissionsBitField.Flags.Speak)) {
        return interaction.editReply('❌ I do not have permission to **SPEAK** in your voice channel.');
      }

      // ✅ En stabil kullanım: play'e direkt query ver (searchResult verme)
      const { track } = await player.play(voiceChannel, query, {
        requestedBy: interaction.user,
        nodeOptions: {
          metadata: {
            channelId: interaction.channelId,
            guildId: interaction.guildId,
            requestedById: interaction.user.id,
          },
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60_000,
          leaveOnEnd: false,
          selfDeaf: true,
          bufferingTimeout: 15_000,
        },
      });

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Added to Queue', iconURL: interaction.user.displayAvatarURL() })
        .setDescription(
          `🎶 **[${track.title}](${track.url})**\n\n` +
          `🎤 Artist: **${track.author || 'Unknown'}**\n` +
          `⏱️ Duration: **${track.duration || 'Unknown'}**`
        )
        .setThumbnail(track.thumbnail || null)
        .setColor('#6366f1')
        .setFooter({ text: `Netrcol Music • Source: ${track.source}` });

      return interaction.editReply({ embeds: [embed] });
    } catch (e) {
      console.error('Play Error:', e);
      return interaction.editReply({
        content: `❌ **Error:** Could not play track.\n\`Reason: ${e?.message || e}\``,
      });
    }
  },
};
