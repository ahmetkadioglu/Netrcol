const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skips the current song.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.editReply('❌ No music is currently playing.');
    }

    const skipped = queue.node.skip();
    if (!skipped) {
      return interaction.editReply('⚠️ Could not skip (queue may be empty).');
    }

    return interaction.editReply('⏩ **Skipped** to the next song!');
  },
};