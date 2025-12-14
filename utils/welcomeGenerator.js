// utils/welcomeGenerator.js - WELCOME IMAGE GENERATOR
const { GlobalFonts, createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const path = require('path');

// Eğer özel font yüklemek istersen:
// GlobalFonts.registerFromPath(path.join(__dirname, '..', 'assets', 'font.ttf'), 'MyFont');

async function createWelcomeCard(member, backgroundUrl = null) {
    const canvas = createCanvas(800, 360);
    const ctx = canvas.getContext('2d');

    // 1. Arka Plan
    try {
        if (backgroundUrl) {
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } else {
            // Varsayılan Arka Plan (Gradient)
            const grd = ctx.createLinearGradient(0, 0, 800, 0);
            grd.addColorStop(0, '#5865F2');
            grd.addColorStop(1, '#2B2D31');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } catch (e) {
        ctx.fillStyle = '#2B2D31';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Karartma Katmanı (Yazı okunsun diye)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(20, 20, 760, 320);

    // 2. Çerçeve
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // 3. Yazılar
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';

    // "WELCOME"
    ctx.font = 'bold 60px Sans';
    ctx.fillText('WELCOME', 400, 240);

    // Kullanıcı Adı
    ctx.font = '40px Sans';
    const name = member.user.username.length > 15 ? member.user.username.substring(0, 15) + '...' : member.user.username;
    ctx.fillText(name.toUpperCase(), 400, 290);

    // Üye Sayısı
    ctx.font = '25px Sans';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Member #${member.guild.memberCount}`, 400, 330);

    // 4. Avatar (Daire)
    try {
        ctx.beginPath();
        ctx.arc(400, 110, 75, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await loadImage(avatarURL);
        ctx.drawImage(avatar, 325, 35, 150, 150);
    } catch (e) {
        console.error('Avatar load error:', e);
    }

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'welcome-image.png' });
}

module.exports = { createWelcomeCard };