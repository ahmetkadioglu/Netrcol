// middleware/auth.js

// Normal sayfa için: login değilse ana sayfaya at
function requireLogin(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/settings');
    }
    next();
}

// API için: login değilse 401 JSON
function requireApiAuth(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

// Admin sayfa / API için: admin değilse yasak
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user || !req.session.isAdmin) {
        // Sayfa isteği ise HTML, API ise JSON dönebilirsin
        if (req.originalUrl.startsWith('/api/')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        return res.status(403).send('Access denied');
    }
    next();
}

module.exports = {
    requireLogin,
    requireApiAuth,
    requireAdmin
};