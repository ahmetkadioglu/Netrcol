const express = require('express');
const app = express();
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const Strategy = require('passport-discord').Strategy;
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser'); // Bu satır çok önemli

module.exports = (client) => {
    // Session Ayarları
    app.use(session({
        secret: 'NetrcolSuperSecretKey',
        resave: false,
        saveUninitialized: false
    }));

    app.use(passport.initialize());
    app.use(passport.session());

    // --- KRİTİK KISIM: Veri Okuyucular ---
    // Bu satırlar olmazsa form verileri sunucuya BOŞ gider!
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    // -------------------------------------

    // View Engine
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.use(expressLayouts);
    app.use(express.static(path.join(__dirname, 'public')));

    // Bot istemcisini isteklere ekle
    app.use((req, res, next) => {
        req.client = client;
        next();
    });

    // Passport
    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
        scope: ['identify', 'guilds']
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => done(null, profile));
    }));

    // Rotalar
    const mainRoutes = require('./routes/main');
    const authRoutes = require('./routes/auth');
    
    app.use('/', mainRoutes);
    app.use('/auth', authRoutes);

    // Başlat
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Web Panel Ready: http://0.0.0.0:${PORT}`);
    });
};