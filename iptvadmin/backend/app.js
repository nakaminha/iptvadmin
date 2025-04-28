require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const logger = require('./utils/logger');
const sqlite3 = require('sqlite3').verbose();

// 1. Defina o caminho do banco
const dbPath = path.join(__dirname, 'iptv_garantido.db');
console.log(`Caminho absoluto do banco: ${dbPath}`);

// 2. Inicialize o banco de dados principal
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        logger.error(`Erro ao conectar ao banco principal: ${err.message}`);
        process.exit(1);
    }
    logger.info('✅ Conexão estável com iptv_garantido.db');
});

const app = express();
const PORT = process.env.PORT || 3000;


// Configurações básicas
app.use(cors({
    origin: 'http://localhost:3000', // Alterado para incluir a porta
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de arquivos estáticos - ATUALIZADA
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, {
    index: 'index.html' // Força o servimento do index.html
}));

// Configuração de sessão
app.use(session({
    store: new SQLiteStore({
        db: 'iptv_garantido.db',
        dir: path.dirname(dbPath)
    }),
    secret: process.env.SESSION_SECRET || 'iptv_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));


// Rotas
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
app.use('/auth', authRouter);
app.use('/api', apiRouter);

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        db_connected: !!db,
        timestamp: new Date().toISOString()
    });
});

// Rota de verificação de sessão
app.get('/auth/check-session', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    
    db.get('SELECT username FROM users WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Usuário não encontrado' });
        res.json({ user });
    });
});

// Rota para dados do dashboard
app.get('/api/dashboard', (req, res) => {
    if (!req.session.userId) return res.sendStatus(401);
    
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM channels) as total_channels,
            (SELECT COUNT(*) FROM active_connections) as connections
    `, (err, data) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(data);
    });
});

// Middleware para evitar cache de páginas autenticadas
app.use((req, res, next) => {
    if (req.path.includes('/dashboard')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
    next();
});

// Rota fallback para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

db.configure("busyTimeout", 5000);


// Inicialização do servidor (única chamada)
const server = app.listen(PORT, () => {
    console.log(`\n🟢 Servidor rodando em http://localhost:${PORT}`);
    logger.info(`Servidor iniciado na porta ${PORT}`);
    
    // Teste imediato
    db.get("SELECT 1 as test", (err) => {
        if (err) {
            console.error('🔴 Teste de conexão com o banco falhou');
            logger.error('Teste de conexão com o banco falhou');
        } else {
            console.log('🟢 Teste de conexão com o banco bem-sucedido');
        }
    });
});



server.on('error', (err) => {
    console.error('🔴 Erro no servidor:', err.message);
    logger.error(`Erro no servidor: ${err.message}`);
    process.exit(1);
});

module.exports = app;