const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stops the music and clears the queue.'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.editReply('❌ No music is currently playing.');
    }

    queue.delete();
    return interaction.editReply('🛑 **Music stopped** and queue cleared.');
  },
};
