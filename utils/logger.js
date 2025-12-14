class Logger {
    constructor() {
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m'
        };
    }

    getTimestamp() {
        return new Date().toISOString();
    }

    formatMessage(level, message) {
        const timestamp = this.getTimestamp();
        let color = this.colors.reset;
        
        switch (level) {
            case 'INFO': color = this.colors.green; break;
            case 'ERROR': color = this.colors.red; break;
            case 'WARN': color = this.colors.yellow; break;
            case 'DEBUG': color = this.colors.blue; break;
        }

        return `[${timestamp}] ${color}${level}${this.colors.reset}: ${message}`;
    }

    info(message) {
        console.log(this.formatMessage('INFO', message));
    }

    error(message) {
        console.error(this.formatMessage('ERROR', message));
    }

    warn(message) {
        console.warn(this.formatMessage('WARN', message));
    }

    debug(message) {
        if (process.env.DEBUG === 'true') {
            console.debug(this.formatMessage('DEBUG', message));
        }
    }
}

module.exports = new Logger();