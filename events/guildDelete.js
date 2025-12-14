// events/guildDelete.js
const { Events } = require('discord.js');
const devLogger = require('../utils/devLogger');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        // Atılınca invite alamayız, fetchOwner hata verebilir (cache'den dene)
        let ownerTag = 'Unknown';
        try {
            const owner = await guild.fetchOwner();
            ownerTag = owner.user.tag;
        } catch(e) {}

        await devLogger.sendLog(guild.client, 'guild', {
            action: 'leave',
            guild,
            ownerTag,
            ownerId: guild.ownerId,
            memberCount: guild.memberCount,
            adderId: 'N/A'
        });
    },
};