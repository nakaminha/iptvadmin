// backend/utils/logger.js
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Configurações do logger
const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const ERROR_FILE = path.join(LOG_DIR, 'errors.log');

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Formato de log padrão
const logFormat = (level, message) => {
  return `[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] [${level.toUpperCase()}] ${message}\n`;
};

// Tipos de log disponíveis
const logger = {
  info: (message) => {
    const logMessage = logFormat('info', message);
    fs.appendFileSync(LOG_FILE, logMessage);
    console.log('\x1b[36m%s\x1b[0m', logMessage.trim()); // Cyan
  },

  warn: (message) => {
    const logMessage = logFormat('warn', message);
    fs.appendFileSync(LOG_FILE, logMessage);
    fs.appendFileSync(ERROR_FILE, logMessage);
    console.log('\x1b[33m%s\x1b[0m', logMessage.trim()); // Yellow
  },

  error: (message, error = null) => {
    let fullMessage = message;
    if (error) {
      fullMessage += `\nStack Trace: ${error.stack}\n${JSON.stringify(error, null, 2)}`;
    }
    const logMessage = logFormat('error', fullMessage);
    fs.appendFileSync(LOG_FILE, logMessage);
    fs.appendFileSync(ERROR_FILE, logMessage);
    console.log('\x1b[31m%s\x1b[0m', logMessage.trim()); // Red
  },

  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = logFormat('debug', message);
      fs.appendFileSync(LOG_FILE, logMessage);
      console.log('\x1b[35m%s\x1b[0m', logMessage.trim()); // Magenta
    }
  },

  // Log de requisições HTTP
  request: (req) => {
    const message = `${req.method} ${req.originalUrl} from ${req.ip}`;
    const logMessage = logFormat('request', message);
    fs.appendFileSync(LOG_FILE, logMessage);
    console.log('\x1b[32m%s\x1b[0m', logMessage.trim()); // Green
  }
};

module.exports = logger;