import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import civicRouter from './routes/civic';

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
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET'],
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

// Mount the Civic API proxy router
app.use('/api/civic', civicRouter);

// 404 handler for unmatched routes
app.use((_req, res) => {
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
