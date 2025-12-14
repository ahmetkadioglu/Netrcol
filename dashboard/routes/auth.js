// dashboard/routes/auth.js - DISCORD LOGIN ROTASI
const express = require('express');
const router = express.Router();
const passport = require('passport');
const { EmbedBuilder } = require('discord.js'); // Embed oluşturmak için ekledik

// --- 1. /login Rotası (Discord'a Yönlendirme) ---
// Kullanıcı Login butonuna tıkladığında buraya gelir ve Discord'a yönlendirilir.
router.get('/login', passport.authenticate('discord', {
    // Sadece kullanıcı kimliğini ve kullanıcının sunucularını bilmek istiyoruz.
    scope: ['identify', 'guilds'] 
}));

// --- 2. /callback Rotası (Discord'dan Geri Dönüş) ---
// Discord'daki başarılı giriş sonrası kullanıcı buraya geri yönlendirilir.
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/', // Başarısız olursa anasayfaya dön
}), async (req, res) => {
    
    // -------------------------------------------------------------------
    // 🔔 GİRİŞ LOGLAMA SİSTEMİ (Developer Server)
    // -------------------------------------------------------------------
    try {
        const client = req.client; // App.js veya Server.js'den gelen bot istemcisi
        const user = req.user; // Passport tarafından sağlanan kullanıcı verisi
        const logChannelId = '1448451761470963922'; // Senin Developer Kanalın

        if (client && user) {
            const channel = client.channels.cache.get(logChannelId);
            
            if (channel) {
                const avatarUrl = user.avatar 
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
                    : `https://cdn.discordapp.com/embed/avatars/0.png`;

                const embed = new EmbedBuilder()
                    .setTitle('📥 Web Paneline Giriş Yapıldı')
                    .setColor('#10b981') // Yeşil (Success)
                    .setThumbnail(avatarUrl)
                    .addFields(
                        { name: '👤 Kullanıcı', value: `${user.username} \`(${user.id})\``, inline: false },
                        { name: '🕒 Zaman', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
                    )
                    .setFooter({ text: 'Netrcol Dashboard Security', iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();

                // Logu kanala gönder (Hata verirse konsola yaz, akışı bozma)
                channel.send({ embeds: [embed] }).catch(err => console.error('Log kanala gönderilemedi:', err));
            } else {
                console.warn(`Log kanalı bulunamadı: ${logChannelId}. Botun bu kanalı gördüğünden emin olun.`);
            }
        }
    } catch (error) {
        console.error('Giriş loglama hatası:', error);
    }
    // -------------------------------------------------------------------

    // Başarılı giriş. Kullanıcıyı Dashboard'a yönlendir.
    res.redirect('/settings'); 
});

// --- 3. /logout Rotası (Çıkış Yapma) ---
router.get('/logout', (req, res, next) => {
    // Passport'un logout fonksiyonunu çağır (Oturumu sonlandırır)
    req.logout((err) => {
        if (err) { 
            return next(err); 
        }
        // Anasayfaya yönlendir
        res.redirect('/');
    });
});

module.exports = router;