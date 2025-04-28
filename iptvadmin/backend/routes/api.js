const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            
            req.session.userId = user.id;
            res.json({ success: true, redirect: '/dashboard.html' });
        });
    });
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, redirect: '/login.html' });
    });
});

module.exports = router;