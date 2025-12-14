// scripts/test-security.js
const config = require('../config/config');

console.log('🔒 SECURITY CHECK REPORT 🔒');
console.log('===========================\n');

const checks = {
    'Session Secret Secure': {
        status: config.sessionSecret !== 'super-secret-key-netrcol',
        message: config.sessionSecret !== 'super-secret-key-netrcol' 
            ? '✅ Session secret is secure' 
            : '❌ CRITICAL: Using default session secret!'
    },
    'Environment File Loaded': {
        status: !!process.env.TOKEN,
        message: process.env.TOKEN 
            ? '✅ .env file loaded successfully' 
            : '❌ .env file not loaded or TOKEN missing'
    },
    'MongoDB URI Secure': {
        status: config.mongoUri && !config.mongoUri.includes('password'),
        message: config.mongoUri 
            ? '✅ MongoDB URI is configured' 
            : '❌ MongoDB URI not configured'
    },
    'Client ID Present': {
        status: !!config.clientId,
        message: config.clientId 
            ? '✅ Client ID is configured' 
            : '❌ Client ID missing'
    },
    'Node Environment': {
        status: process.env.NODE_ENV === 'development',
        message: `Current environment: ${process.env.NODE_ENV || 'development'}`
    }
};

Object.keys(checks).forEach(check => {
    const { status, message } = checks[check];
    console.log(`${status ? '✅' : '❌'} ${check}: ${message}`);
});

console.log('\n📊 SUMMARY:');
console.log(`Passed: ${Object.values(checks).filter(c => c.status).length}/${Object.keys(checks).length}`);

if (checks['Session Secret Secure'].status === false) {
    console.log('\n⚠️  CRITICAL ISSUE DETECTED!');
    console.log('Please update your session secret immediately:');
    console.log('1. Add SESSION_SECRET to your .env file');
    console.log('2. Update config/config.js with sessionSecret: process.env.SESSION_SECRET');
    console.log('3. Restart your dashboard');
}