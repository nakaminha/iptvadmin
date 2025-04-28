const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 1. Caminho absoluto garantido para Windows
const dbPath = path.join(require('os').tmpdir(), 'iptv_garantido.db');

// 2. Função para garantir arquivo físico
function ensurePhysicalFile() {
    try {
        const dbDir = path.dirname(dbPath);
        
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
            logger.info(`📁 Diretório criado: ${dbDir}`);
        }

        // Cria arquivo vazio se não existir
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, '');
            logger.info(`🆕 Arquivo do banco criado: ${dbPath}`);
        }

        // Verifica permissões
        fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
        logger.info('🔐 Permissões verificadas com sucesso');

    } catch (err) {
        logger.error('❌ Falha ao preparar arquivo do banco:', err);
        logger.info('💡 Execute como Administrador ou escolha outro local:');
        logger.info(`👉 Alternativa: ${path.join(require('os').homedir(), 'iptv.db')}`);
        process.exit(1);
    }
}

// Cria a conexão
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        process.exit(1); // Encerra o aplicativo se não conectar
    }
    console.log('✅ Conexão com SQLite estabelecida em:', dbPath);
});

// Cria tabelas se não existirem
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) console.error('Erro ao criar tabela users:', err);
    });
});

// 3. Conexão com tratamento definitivo
function createDatabase() {
    return new Promise((resolve, reject) => {
        ensurePhysicalFile();

        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                logger.error('🚨 Erro de conexão:', {
                    code: err.code,
                    path: dbPath,
                    syscall: err.syscall
                });
                return reject(new Error(`Não foi possível abrir ${dbPath}`));
            }
            logger.info(`✅ Conexão estável com ${path.basename(dbPath)}`);
            resolve(db);
        });

        // Eventos adicionais para debug
        db.on('error', (err) => {
            logger.error('💥 Evento de erro do SQLite:', err);
        });

        db.on('open', () => {
            logger.debug('🔌 Conexão aberta');
        });
    });
}

// 4. Exportação como Promise resolvida
module.exports = (async () => {
    try {
        const db = await createDatabase();
        
        await new Promise((resolve, reject) => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) return reject(err);
                logger.info('🛠️ Tabela users verificada');
                resolve();
            });
        });

        return {
            db,
            initializeDatabase: () => Promise.resolve() // Já inicializado
        };
    } catch (err) {
        logger.error('🔥 Falha na inicialização do banco:', err);
        process.exit(1);
    }
})();

module.exports = { db, dbPath };