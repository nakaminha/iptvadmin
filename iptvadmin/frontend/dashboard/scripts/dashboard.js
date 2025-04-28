const { requireAuth } = require('../middleware/auth-middleware');

router.get('/dashboard/data', requireAuth, (req, res) => {
    const userId = req.session.user.id;
    
    db.get(`
        SELECT 
            (SELECT COUNT(*) FROM user_services WHERE user_id = ?) as services,
            (SELECT COUNT(*) FROM user_devices WHERE user_id = ?) as devices
    `, [userId, userId], (err, data) => {
        if (err) {
            logger.error('Dashboard error:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }
        
        res.json({
            user: req.session.user,
            stats: data
        });
    });
});

