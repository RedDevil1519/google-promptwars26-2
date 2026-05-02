import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import civicRouter from './routes/civic';
import translateRouter from './routes/translate';
import explainRouter from './routes/explain';
import indiaRouter from './routes/india';

// Load environment variables from .env file before any other code
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

/**
 * Security middleware: sets secure HTTP headers using Helmet.
 * This protects against well-known web vulnerabilities like XSS,
 * clickjacking, and MIME sniffing.
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * CORS: allow requests only from the Vite dev server in development.
 * In production, replace with your actual domain.
 */
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
  /\.run\.app$/, // Allow all Cloud Run service URLs
];
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

// Parse JSON request bodies
app.use(express.json());

/**
 * Health-check endpoint for deployment readiness probes.
 * @route GET /health
 */
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount the API proxy routers
app.use('/api/civic', civicRouter);
app.use('/api/translate', translateRouter);
app.use('/api/explain', explainRouter);
app.use('/api/india', indiaRouter);

// Serve frontend static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Fallback all other GET requests to the frontend index.html for React Router
app.get('*', (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

// 404 handler for unmatched API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('[Server Error]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`✅  Voter Protocol Engine backend running on port ${PORT}`);
});

export default app;
