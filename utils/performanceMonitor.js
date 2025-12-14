const { EventEmitter } = require('events');
const logger = require('./logger');

class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = {
            commandExecution: {
                counts: new Map(),
                responseTimes: new Map(),
                errors: new Map()
            },
            eventProcessing: {
                counts: new Map(),
                processingTimes: new Map()
            },
            database: {
                queryCounts: new Map(),
                queryTimes: new Map(),
                errorCounts: new Map()
            },
            memory: {
                usage: [],
                gcCount: 0
            },
            network: {
                wsPings: [],
                apiLatencies: []
            }
        };

        this.history = {
            commandUsage: [],
            memoryUsage: [],
            responseTimes: [],
            timestamp: Date.now()
        };

        this.startTime = Date.now();
        this.commandCount = 0;
        this.eventCount = 0;

        this.startMonitoring();
        logger.info('Performance Monitor başlatıldı');
    }

    startMonitoring() {
        // Bellek kullanımını izle (5 saniyede bir)
        this.memoryInterval = setInterval(() => {
            this.recordMemoryUsage();
        }, 5000);

        // Metrikleri temizle (1 saatte bir)
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldMetrics();
        }, 3600000);

        // History kaydet (15 dakikada bir)
        this.historyInterval = setInterval(() => {
            this.saveHistorySnapshot();
        }, 900000);

        // GC izleme
        if (global.gc) {
            this.setupGCMonitoring();
        }
    }

    // Komut yürütme metrikleri
    recordCommandExecution(commandName, executionTime, success = true) {
        this.commandCount++;
        
        // Komut sayısı
        const currentCount = this.metrics.commandExecution.counts.get(commandName) || 0;
        this.metrics.commandExecution.counts.set(commandName, currentCount + 1);

        // Yanıt süreleri
        if (!this.metrics.commandExecution.responseTimes.has(commandName)) {
            this.metrics.commandExecution.responseTimes.set(commandName, []);
        }
        this.metrics.commandExecution.responseTimes.get(commandName).push(executionTime);

        // Hatalar
        if (!success) {
            const errorCount = this.metrics.commandExecution.errors.get(commandName) || 0;
            this.metrics.commandExecution.errors.set(commandName, errorCount + 1);
        }

        // En son 100 kaydı tut
        const times = this.metrics.commandExecution.responseTimes.get(commandName);
        if (times.length > 100) {
            times.shift();
        }

        this.emit('commandExecuted', { commandName, executionTime, success });
    }

    // Event işleme metrikleri
    recordEventProcessing(eventName, processingTime) {
        this.eventCount++;
        
        const currentCount = this.metrics.eventProcessing.counts.get(eventName) || 0;
        this.metrics.eventProcessing.counts.set(eventName, currentCount + 1);

        if (!this.metrics.eventProcessing.processingTimes.has(eventName)) {
            this.metrics.eventProcessing.processingTimes.set(eventName, []);
        }
        this.metrics.eventProcessing.processingTimes.get(eventName).push(processingTime);

        const times = this.metrics.eventProcessing.processingTimes.get(eventName);
        if (times.length > 50) {
            times.shift();
        }
    }

    // Database metrikleri
    recordDatabaseQuery(collection, queryTime, success = true) {
        // Sorgu sayısı
        const queryCount = this.metrics.database.queryCounts.get(collection) || 0;
        this.metrics.database.queryCounts.set(collection, queryCount + 1);

        // Sorgu süreleri
        if (!this.metrics.database.queryTimes.has(collection)) {
            this.metrics.database.queryTimes.set(collection, []);
        }
        this.metrics.database.queryTimes.get(collection).push(queryTime);

        // Hatalar
        if (!success) {
            const errorCount = this.metrics.database.errorCounts.get(collection) || 0;
            this.metrics.database.errorCounts.set(collection, errorCount + 1);
        }

        // En son 50 kaydı tut
        const times = this.metrics.database.queryTimes.get(collection);
        if (times.length > 50) {
            times.shift();
        }
    }

    // Bellek kullanımı
    recordMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const timestamp = Date.now();
        
        this.metrics.memory.usage.push({
            timestamp,
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external
        });

        // Son 100 ölçümü tut
        if (this.metrics.memory.usage.length > 100) {
            this.metrics.memory.usage.shift();
        }

        // Yüksek bellek kullanımı uyarısı
        if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
            this.emit('highMemoryUsage', memoryUsage);
            logger.warn(`Yüksek bellek kullanımı: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }
    }

    // WebSocket ping
    recordWebSocketPing(ping) {
        this.metrics.network.wsPings.push({
            timestamp: Date.now(),
            ping
        });

        if (this.metrics.network.wsPings.length > 50) {
            this.metrics.network.wsPings.shift();
        }

        // Yüksek ping uyarısı
        if (ping > 500) {
            this.emit('highPing', ping);
            logger.warn(`Yüksek WebSocket ping: ${ping}ms`);
        }
    }

    // API gecikmesi
    recordAPILatency(latency) {
        this.metrics.network.apiLatencies.push({
            timestamp: Date.now(),
            latency
        });

        if (this.metrics.network.apiLatencies.length > 50) {
            this.metrics.network.apiLatencies.shift();
        }
    }

    // GC izleme
    setupGCMonitoring() {
        process.on('gc', (info) => {
            this.metrics.memory.gcCount++;
            this.emit('garbageCollection', info);
        });
    }

    // History snapshot'ı kaydet
    saveHistorySnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            commandCount: this.commandCount,
            eventCount: this.eventCount,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            commands: Object.fromEntries(this.metrics.commandExecution.counts)
        };

        this.history.commandUsage.push(snapshot);
        this.history.memoryUsage.push({
            timestamp: snapshot.timestamp,
            memory: snapshot.memoryUsage
        });

        // Son 100 snapshot'ı tut
        if (this.history.commandUsage.length > 100) {
            this.history.commandUsage.shift();
        }
        if (this.history.memoryUsage.length > 100) {
            this.history.memoryUsage.shift();
        }
    }

    // Eski metrikleri temizle
    cleanupOldMetrics() {
        const now = Date.now();
        const oneHour = 3600000;

        // Eski bellek kullanım verilerini temizle
        this.metrics.memory.usage = this.metrics.memory.usage.filter(
            usage => now - usage.timestamp < oneHour
        );

        // Eski network verilerini temizle
        this.metrics.network.wsPings = this.metrics.network.wsPings.filter(
            ping => now - ping.timestamp < oneHour
        );
        this.metrics.network.apiLatencies = this.metrics.network.apiLatencies.filter(
            latency => now - latency.timestamp < oneHour
        );

        logger.debug('Eski performans metrikleri temizlendi');
    }

    // Metrikleri getir
    getMetrics() {
        const currentMemory = process.memoryUsage();
        const uptime = process.uptime();

        return {
            general: {
                uptime,
                commandCount: this.commandCount,
                eventCount: this.eventCount,
                gcCount: this.metrics.memory.gcCount
            },
            memory: {
                current: currentMemory,
                history: this.metrics.memory.usage.slice(-10), // Son 10 ölçüm
                average: this.calculateMemoryAverage()
            },
            commands: {
                total: this.commandCount,
                byCommand: Object.fromEntries(this.metrics.commandExecution.counts),
                averageResponseTimes: this.calculateAverageResponseTimes(),
                errorRates: this.calculateErrorRates()
            },
            events: {
                total: this.eventCount,
                byEvent: Object.fromEntries(this.metrics.eventProcessing.counts),
                averageProcessingTimes: this.calculateAverageProcessingTimes()
            },
            database: {
                queryCounts: Object.fromEntries(this.metrics.database.queryCounts),
                averageQueryTimes: this.calculateAverageQueryTimes(),
                errorCounts: Object.fromEntries(this.metrics.database.errorCounts)
            },
            network: {
                averagePing: this.calculateAveragePing(),
                averageLatency: this.calculateAverageLatency(),
                recentPings: this.metrics.network.wsPings.slice(-10)
            }
        };
    }

    // Performans history'sini getir
    getPerformanceHistory() {
        return {
            commandUsage: this.history.commandUsage,
            memoryUsage: this.history.memoryUsage,
            startTime: this.startTime
        };
    }

    // Event istatistikleri
    getEventStats() {
        return {
            counts: Object.fromEntries(this.metrics.eventProcessing.counts),
            processingTimes: Object.fromEntries(
                Array.from(this.metrics.eventProcessing.processingTimes.entries()).map(([event, times]) => [
                    event,
                    times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0
                ])
            )
        };
    }

    // Health check
    getHealthStatus() {
        const metrics = this.getMetrics();
        const issues = [];

        // Yüksek bellek kullanımı
        if (metrics.memory.current.heapUsed > 400 * 1024 * 1024) {
            issues.push('Yüksek bellek kullanımı');
        }

        // Yüksek ping
        if (metrics.network.averagePing > 300) {
            issues.push('Yüksek WebSocket ping');
        }

        // Yüksek hata oranı
        const totalErrors = Object.values(metrics.commands.errorRates).reduce((a, b) => a + b, 0);
        const totalCommands = metrics.commands.total;
        const errorRate = totalCommands > 0 ? totalErrors / totalCommands : 0;

        if (errorRate > 0.1) { // %10'dan fazla hata
            issues.push('Yüksek komut hata oranı');
        }

        return {
            status: issues.length === 0 ? 'healthy' : 'degraded',
            issues,
            score: this.calculateHealthScore(metrics, issues),
            timestamp: Date.now()
        };
    }

    // Yardımcı hesaplama fonksiyonları
    calculateMemoryAverage() {
        if (this.metrics.memory.usage.length === 0) return {};
        
        const sums = { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
        this.metrics.memory.usage.forEach(usage => {
            sums.rss += usage.rss;
            sums.heapTotal += usage.heapTotal;
            sums.heapUsed += usage.heapUsed;
            sums.external += usage.external;
        });

        const count = this.metrics.memory.usage.length;
        return {
            rss: sums.rss / count,
            heapTotal: sums.heapTotal / count,
            heapUsed: sums.heapUsed / count,
            external: sums.external / count
        };
    }

    calculateAverageResponseTimes() {
        const averages = {};
        for (const [command, times] of this.metrics.commandExecution.responseTimes.entries()) {
            if (times.length > 0) {
                averages[command] = times.reduce((a, b) => a + b, 0) / times.length;
            }
        }
        return averages;
    }

    calculateErrorRates() {
        const rates = {};
        for (const [command, errorCount] of this.metrics.commandExecution.errors.entries()) {
            const totalCount = this.metrics.commandExecution.counts.get(command) || 0;
            rates[command] = totalCount > 0 ? errorCount / totalCount : 0;
        }
        return rates;
    }

    calculateAverageProcessingTimes() {
        const averages = {};
        for (const [event, times] of this.metrics.eventProcessing.processingTimes.entries()) {
            if (times.length > 0) {
                averages[event] = times.reduce((a, b) => a + b, 0) / times.length;
            }
        }
        return averages;
    }

    calculateAverageQueryTimes() {
        const averages = {};
        for (const [collection, times] of this.metrics.database.queryTimes.entries()) {
            if (times.length > 0) {
                averages[collection] = times.reduce((a, b) => a + b, 0) / times.length;
            }
        }
        return averages;
    }

    calculateAveragePing() {
        if (this.metrics.network.wsPings.length === 0) return 0;
        return this.metrics.network.wsPings.reduce((sum, ping) => sum + ping.ping, 0) / this.metrics.network.wsPings.length;
    }

    calculateAverageLatency() {
        if (this.metrics.network.apiLatencies.length === 0) return 0;
        return this.metrics.network.apiLatencies.reduce((sum, latency) => sum + latency.latency, 0) / this.metrics.network.apiLatencies.length;
    }

    calculateHealthScore(metrics, issues) {
        let score = 100;

        // Bellek kullanımı (maksimum 30 puan düşüş)
        const memoryUsage = metrics.memory.current.heapUsed / 1024 / 1024;
        if (memoryUsage > 500) score -= 30;
        else if (memoryUsage > 400) score -= 20;
        else if (memoryUsage > 300) score -= 10;

        // Ping (maksimum 20 puan düşüş)
        if (metrics.network.averagePing > 500) score -= 20;
        else if (metrics.network.averagePing > 300) score -= 10;

        // Hata oranı (maksimum 30 puan düşüş)
        const totalErrors = Object.values(metrics.commands.errorRates).reduce((a, b) => a + b, 0);
        const totalCommands = metrics.commands.total;
        const errorRate = totalCommands > 0 ? totalErrors / totalCommands : 0;
        
        if (errorRate > 0.2) score -= 30;
        else if (errorRate > 0.1) score -= 20;
        else if (errorRate > 0.05) score -= 10;

        // Issue sayısı (maksimum 20 puan düşüş)
        score -= issues.length * 5;

        return Math.max(0, Math.round(score));
    }

    // Monitor'ü durdur
    stop() {
        if (this.memoryInterval) clearInterval(this.memoryInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        if (this.historyInterval) clearInterval(this.historyInterval);
        logger.info('Performance Monitor durduruldu');
    }
}

module.exports = new PerformanceMonitor();