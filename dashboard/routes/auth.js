// dashboard/routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// ====================================================
// 1. GİRİŞ ROTASI (/auth/login)
// ====================================================
router.get('/login', (req, res, next) => {
    // KRİTİK DÜZELTME: Rate Limit Engelleyici
    // Eğer kullanıcı zaten giriş yapmışsa, Discord'a hiç gitme.
    // Direkt sunucu seçim ekranına (/settings) yönlendir.
    if (req.user) {
        return res.redirect('/settings');
    }
    
    // Giriş yapmamışsa devam et, Discord'a yönlendir.
    next();
}, passport.authenticate('discord'));

// ====================================================
// 2. CALLBACK ROTASI (/auth/callback)
// ====================================================
router.get('/callback', 
    passport.authenticate('discord', { 
        failureRedirect: '/', // Hata olursa anasayfaya at
    }), 
    (req, res) => {
        // Başarılı girişten sonra yönlendirilecek yer
        res.redirect('/settings');
    }
);

// ====================================================
// 3. ÇIKIŞ ROTASI (/auth/logout)
// ====================================================
router.get('/logout', (req, res, next) => {
    // Passport.js yeni sürümlerinde logout callback gerektirir
    req.logout(function(err) {
        if (err) { return next(err); }
        // Oturumu sildikten sonra anasayfaya dön
        res.redirect('/');
    });
});

module.exports = router;