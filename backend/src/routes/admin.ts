import express from 'express';

const router = express.Router();

/**
 * Mock JWT login for production-grade admin dashboard.
 * In a real app, this would verify credentials against a database
 * and sign a real JWT using a secret key.
 *
 * @route POST /api/admin/login
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    // Return a mock JWT token and user info
    return res.status(200).json({
      success: true,
      token: 'mock-jwt-header.' + btoa(JSON.stringify({ user: 'admin', role: 'editor' })) + '.mock-signature',
      user: {
        id: '1',
        username: 'admin',
        role: 'SUPER_ADMIN'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Invalid credentials. Please use admin / admin123'
  });
});

/**
 * Mock telemetry data for the admin dashboard.
 * @route GET /api/admin/stats
 */
router.get('/stats', (_req, res) => {
  res.status(200).json({
    stats: [
      { label: 'Total Queries Today', value: '1,284', icon: '📊', color: '#e63946' },
      { label: 'US Mode Hits', value: '891', icon: '🇺🇸', color: '#4ade80' },
      { label: 'India Mode Hits', value: '312', icon: '🇮🇳', color: '#fb923c' },
      { label: 'Cache Hit Rate', value: '78%', icon: '⚡', color: '#a78bfa' },
      { label: 'Gemini API Calls', value: '403', icon: '🤖', color: '#f472b6' },
      { label: 'Avg Response (ms)', value: '420', icon: '🏎️', color: '#34d399' },
    ]
  });
});

export default router;
