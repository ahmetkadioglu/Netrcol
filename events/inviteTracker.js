// events/inviteTracker.js
const { Events, Collection } = require('discord.js');
const db = require('../utils/database');

module.exports = {
    name: 'inviteTracker',
    
    async execute(client) {
        client.invites = new Collection();

        const loadInvites = async () => {
            console.log('🔄 Davet sistemi optimize ediliyor...');
            
            // 1. Veritabanına bağlan
            const database = db.db;
            if (!database) return console.log('❌ DB Bağlantısı yok, davetler yüklenemedi.');

            // 2. SADECE log kanalı ayarlamış sunucuları bul (PERFORMANS KURTARICISI)
            // Tüm sunucuları değil, sadece bu özelliği kullananları çekiyoruz.
            const activeGuilds = await database.collection('guildSettings')
                .find({ inviteLogChannel: { $exists: true, $ne: null } })
                .toArray();

            const activeGuildIds = activeGuilds.map(g => g.guildId);
            console.log(`📊 Toplam ${client.guilds.cache.size} sunucudan ${activeGuildIds.length} tanesi log sistemini kullanıyor.`);

            // 3. Sadece aktif sunucuların davetlerini çek
            let successCount = 0;
            
            for (const guildId of activeGuildIds) {
                const guild = client.guilds.cache.get(guildId);
                if (!guild) continue; // Bot sunucudan atılmışsa geç

                try {
                    const invites = await guild.invites.fetch();
                    const codeUses = new Collection();
                    invites.each(inv => codeUses.set(inv.code, inv.uses));
                    client.invites.set(guildId, codeUses);
                    successCount++;
                    
                    // Discord API'yi boğmamak için her istek arası minik bir bekleme
                    await new Promise(res => setTimeout(res, 100)); 

                } catch (err) {
                    // Yetkisi yoksa veya hata varsa sessizce geç
                }
            }
            console.log(`✅ ${successCount} sunucunun davetleri önbelleğe alındı.`);
        };

        // Bot Hazır Olduğunda
        client.on(Events.ClientReady, async () => {
            // Veritabanı bağlantısının oturması için 3 saniye bekle
            setTimeout(() => loadInvites(), 3000);
        });

        // Yeni Davet Oluşturulursa (Sadece sistemi kullananlar için işle)
        client.on(Events.InviteCreate, async (invite) => {
            if (client.invites.has(invite.guild.id)) {
                const invites = client.invites.get(invite.guild.id);
                invites.set(invite.code, invite.uses);
                client.invites.set(invite.guild.id, invites);
            }
        });

        // Davet Silinirse
        client.on(Events.InviteDelete, (invite) => {
            if (client.invites.has(invite.guild.id)) {
                const invites = client.invites.get(invite.guild.id);
                invites.delete(invite.code);
                client.invites.set(invite.guild.id, invites);
            }
        });
    }
};