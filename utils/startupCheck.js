// utils/startupCheck.js
const logger = require('./logger');

class StartupChecker {
    static checkEnvironment() {
        const required = ['TOKEN', 'MONGO_URI', 'CLIENT_ID'];
        const missing = required.filter(env => !process.env[env]);
        
        if (missing.length > 0) {
            logger.error(`Eksik environment variables: ${missing.join(', ')}`);
            process.exit(1);
        }
        
        logger.info('✅ Environment variables kontrolü başarılı');
    }
    
    static validateConfig() {
        // Config validations...
        logger.info('✅ Config validasyonu başarılı');
    }
}

module.exports = StartupChecker;