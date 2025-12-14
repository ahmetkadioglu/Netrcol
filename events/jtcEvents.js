// events/jtcEvents.js - FIXED NULL CHANNEL ERROR
const { Events } = require('discord.js');
const db = require('../utils/database');
const jtcManager = require('../utils/jtcManager');

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild;
        const member = newState.member;

        // Settings kontrolü
        const settings = await db.getJTCSettings(guild.id);
        if (!settings || !settings.enabled) return;

        // A) KANALA KATILMA (ODA OLUŞTURMA)
        if (newState.channelId === settings.triggerChannelId) {
            await jtcManager.createPrivateRoom(member, guild, settings.categoryId);
        }

        // B) KANALDAN AYRILMA (ODA SİLME)
        if (oldState.channelId) {
            const channel = oldState.channel;
            
            // ✅ HATA DÜZELTMESİ: Kanal hala var mı?
            if (!channel) return; 

            // Bu bir JTC kanalı mı?
            const jtcData = await db.getActiveJTC(channel.id);
            
            if (jtcData) {
                // Kanal boş mu? (Botlar hariç)
                // members.size bazen gecikmeli olabilir, garanti olsun diye 0 kontrolü yapıyoruz
                if (channel.members.size === 0) {
                    try {
                        await channel.delete().catch(() => {});
                        await db.removeActiveJTC(channel.id);
                    } catch (e) {
                        // Kanal zaten silinmiş olabilir, hata verme
                        console.log('JTC Cleanup: Channel already deleted.');
                    }
                }
            }
        }
    },
};