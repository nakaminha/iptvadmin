const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');
const logger = require('../utils/logger');


// Middleware de debug para rotas
router.use((req, res, next) => {
    logger.debug(`Acessando rota de auth: ${req.method} ${req.path}`);
    next();
});

// Rota de saúde
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Auth routes working',
        timestamp: new Date().toISOString()
    });
});


router.get('/check-session', (req, res) => {
    // SEM session? Retorna erro CRÍTICO
    if (!req.session.userId) {
      return res.status(401)
        .set({
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        })
        .json({ 
          status: 'invalid',
          code: 'NO_SESSION'
        });
    }
  
    // Verifica se o usuário ainda existe no banco
    db.get('SELECT username FROM users WHERE id = ?', [req.session.userId], 
      (err, user) => {
        if (err || !user) {
          req.session.destroy(); // Mata a sessão corrompida
          return res.status(401).json({ 
            status: 'invalid',
            code: 'USER_NOT_FOUND'
          });
        }
  
        // Sessão VÁLIDA
        res.set({
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json'
        }).json({
          status: 'valid',
          user: {
            username: user.username
          }
        });
    });
  });


// Login Adaptado para Dashboard
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validação mais robusta
    if (!username?.trim() || !password?.trim()) {
        return res.status(400).json({ 
            error: 'Credenciais inválidas',
            fields: {
                username: !username?.trim() ? 'Campo obrigatório' : null,
                password: !password?.trim() ? 'Campo obrigatório' : null
            },
            code: 'MISSING_CREDENTIALS'
        });
    }

    db.get(`
        SELECT id, username, password, email, created_at, avatar 
        FROM users 
        WHERE username = ?
    `, [username.trim()], (err, user) => {
        if (err) {
            logger.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Erro no sistema',
                code: 'DB_ERROR' 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS' 
            });
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ 
                    error: 'Credenciais inválidas',
                    code: 'INVALID_CREDENTIALS'
                });
            }
            
            // Cria sessão com mais dados
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email
            };
            
            logger.info(`Login bem-sucedido: ${user.username}`);
            
            // Dentro da rota POST /login, atualize a resposta:
            res.json({ 
                success: true, 
                redirect: '/dashboard', // Mude para isso
                user: {
                    id: user.id,
                    username: user.username
                }
            });
        });
    });
});



// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            logger.error('Erro ao fazer logout:', err);
            return res.status(500).json({ 
                error: 'Erro ao fazer logout',
                code: 'LOGOUT_ERROR'
            });
        }
        res.clearCookie('connect.sid');
        logger.info('Logout realizado com sucesso');
        res.json({ 
            success: true, 
            redirect: '/login.html'
        });
    });
});


// Registro (versão unificada e aprimorada)
router.post('/register', async (req, res) => {
    logger.debug('Iniciando processo de registro', { body: req.body });
    
    try {
        const { username, email, password } = req.body;
        
        // Validação
        if (!username || username.length < 4) {
            return res.status(400).json({ 
                error: 'Nome de usuário deve ter pelo menos 4 caracteres',
                field: 'username',
                code: 'INVALID_USERNAME'
            });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ 
                error: 'Por favor, insira um email válido',
                field: 'email',
                code: 'INVALID_EMAIL'
            });
        }

        if (!password || password.length < 8) {
            return res.status(400).json({ 
                error: 'A senha deve ter no mínimo 8 caracteres',
                field: 'password',
                code: 'INVALID_PASSWORD'
            });
        }

        // Verificação de usuário existente
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
        [username, email], async (err, user) => {
            if (err) {
                logger.error('Erro ao verificar usuário existente:', err);
                return res.status(500).json({ 
                    error: 'Erro ao verificar usuário',
                    code: 'DB_ERROR'
                });
            }
            
            if (user) {
                const field = user.username === username ? 'username' : 'email';
                logger.warn(`Tentativa de registro com ${field} já existente: ${field === 'username' ? username : email}`);
                return res.status(409).json({ 
                    error: `${field === 'username' ? 'Nome de usuário' : 'Email'} já está em uso`,
                    field,
                    code: 'USER_EXISTS'
                });
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Inserção no banco de dados
            db.run(
                `INSERT INTO users (username, email, password, created_at) 
                 VALUES (?, ?, ?, datetime('now'))`, 
                [username, email, hashedPassword], 
                function(err) {
                    if (err) {
                        logger.error('Erro ao criar usuário:', err);
                        return res.status(500).json({ 
                            error: 'Erro ao criar conta',
                            code: 'CREATE_USER_ERROR'
                        });
                    }
                    
                    logger.info(`Novo usuário registrado: ${username} (ID: ${this.lastID})`);
                    res.status(201).json({ 
                        success: true,
                        userId: this.lastID,
                        message: 'Conta criada com sucesso',
                        user: {
                            username,
                            email
                        }
                    });
                }
            );
        });
    } catch (error) {
        logger.error('Erro inesperado no registro:', error);
        res.status(500).json({ 
            error: 'Erro interno no servidor',
            code: 'INTERNAL_ERROR'
        });
    }
});

module.exports = router;