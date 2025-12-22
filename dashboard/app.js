// dashboard/app.js - LAYOUT DÜZELTMESİ (TAM SÜRÜM)
const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const expressLayouts = require('express-ejs-layouts'); // YENİ EKLE
const config = require('../config/config');

const mainRoutes = require('./routes/main');
const authRoutes = require('./routes/auth');

const app = express();

// 1. Görüntü Motoru (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. LAYOUT MOTORUNU TANITMA (Kritik nokta)
app.use(expressLayouts); 
app.set('layout', 'layout'); // Varsayılan layout dosyasının adını belirtir

// 3. Statik Dosyalar
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/css', express.static(path.join(__dirname, 'css'))); // ✅ EKLE
app.use('/js', express.static(path.join(__dirname, 'js')));   // ✅ varsa ekle


// 4. PASSPORT AYARLARI (Kısaltıldı)
passport.serializeUser((user, done) => { done(null, user); });
passport.deserializeUser((obj, done) => { done(null, obj); });
passport.use(new DiscordStrategy({
    clientID: config.clientId, clientSecret: config.clientSecret, callbackURL: config.callbackUrl, scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => { process.nextTick(() => done(null, profile)); }));

// 5. OTURUM VE PASSPORT MIDDLEWARE
app.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: false, cookie: { maxAge: 24 * 60 * 60 * 1000 } }));
app.use(passport.initialize());
app.use(passport.session());

// 6. Bot İstemcisini ve Kullanıcıyı Rotalara Taşıyan Middleware
app.use((req, res, next) => {
    req.client = req.app.get('client');
    res.locals.user = req.user;
    // req.user null ise bile, EJS'de hata vermemek için ek bir kontrol
    res.locals.discordUser = req.user || null;
    next();
});

// 7. ROTLARI KULLAN
app.use('/', mainRoutes);
app.use('/auth', authRoutes);

module.exports = app;