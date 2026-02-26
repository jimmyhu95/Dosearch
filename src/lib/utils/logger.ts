import fs from 'fs';
import path from 'path';

class Logger {
    private logFilePath: string | null = null;
    private isNodeEnv: boolean;

    constructor() {
        this.isNodeEnv = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

        if (this.isNodeEnv) {
            const logDir = path.join(process.cwd(), 'data', 'logs');
            this.logFilePath = path.join(logDir, 'runtime.log');

            // Ensure directory exists
            try {
                if (!fs.existsSync(logDir)) {
                    fs.mkdirSync(logDir, { recursive: true });
                }
            } catch (error) {
                console.error('Failed to create log directory:', error);
            }
        }
    }

    private writeToFile(level: string, message: string, ...optionalParams: unknown[]) {
        if (!this.logFilePath || !this.isNodeEnv) return;

        try {
            const timestamp = new Date().toISOString();
            let formattedParams = '';
            if (optionalParams.length > 0) {
                formattedParams = ' ' + optionalParams.map(param =>
                    typeof param === 'object' ? JSON.stringify(param, Object.getOwnPropertyNames(param)) : String(param)
                ).join(' ');
            }
            const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedParams}\n`;
            fs.appendFileSync(this.logFilePath, logLine, 'utf8');
        } catch (error) {
            // Intentionally swallow error if file write fails, to prevent infinite loops or app crashes
            console.error('Failed to write to log file:', error);
        }
    }

    info(message: string, ...optionalParams: unknown[]) {
        console.log(message, ...optionalParams);
        this.writeToFile('info', message, ...optionalParams);
    }

    warn(message: string, ...optionalParams: unknown[]) {
        console.warn(message, ...optionalParams);
        this.writeToFile('warn', message, ...optionalParams);
    }

    error(message: string, ...optionalParams: unknown[]) {
        console.error(message, ...optionalParams);
        this.writeToFile('error', message, ...optionalParams);
    }
}

export const logger = new Logger();
