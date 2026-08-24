import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===============================
// API ROUTES
// ===============================
app.use('/api', apiRouter);

// ===============================
// HEALTH CHECK
// ===============================
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    time: new Date().toISOString(),
  });
});

// ===============================
// DIGITAL INVOICE
// ===============================
app.get('/api/pos/invoice-html/:id', (req, res) => {
  const { id } = req.params;

  res.redirect(`/#/invoice/${id}`);
});

// ===============================
// LOCAL DEVELOPMENT
// ===============================
async function startDevelopmentServer() {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `POS Retail Server running on http://localhost:${PORT}`
    );
  });
}

// ===============================
// START ONLY LOCALLY
// ===============================
if (!process.env.VERCEL) {
  startDevelopmentServer().catch((error) => {
    console.error('Failed to start development server:', error);
    process.exit(1);
  });
}

// IMPORTANT:
// Vercel will import this Express app.
export default app;
